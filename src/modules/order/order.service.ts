import { StatusCodes } from 'http-status-codes';
import { Prisma, OrderStatus } from '@prisma/client';
import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';
import { freeDeliveryService } from '../freeDelivery/freeDelivery.service.js';

type OrderItemInput = {
  productId: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
};

type CheckoutPayload = {
  customerName: string;
  customerPhone: string;
  address: string;
  district: string;
  union?: string | null;
  orderNotes?: string | null;
  items: OrderItemInput[];
  promoCode?: string | null;
};

type GetOrdersQueryInput = {
  page: number;
  limit: number;
  search?: string;
  status?: OrderStatus;
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const calculateFlashSalePrice = (
  discountedPrice: number,
  discountType: string,
  discountValue: number
): number => {
  if (discountType === 'PERCENT') {
    const nextPrice = discountedPrice - (discountedPrice * discountValue) / 100;
    return roundToTwoDecimals(Math.max(nextPrice, 0));
  }
  const nextPrice = discountedPrice - discountValue;
  return roundToTwoDecimals(Math.max(nextPrice, 0));
};

const checkout = async (payload: CheckoutPayload) => {
  const { items, promoCode } = payload;
  
  if (!items || items.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Cart is empty');
  }

  const productIds = items.map(i => i.productId);
  const now = new Date();
  
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: {
      variants: true,
      flashSaleItems: {
        where: {
          flashSaleCampaign: { startAt: { lte: now }, endAt: { gt: now } }
        },
        include: { flashSaleCampaign: true }
      }
    }
  });

  let subtotal = 0;
  const orderItemsData: any[] = [];

  for (const item of items) {
    const product = products.find(p => p.id === item.productId);
    if (!product) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Product not found (ID: ${item.productId})`);
    }

    let variant = product.variants.find(v => 
      (item.color ? v.color === item.color : true) && 
      (item.size ? v.size === item.size : true)
    );
    
    if (!variant && product.variants.length > 0) {
      variant = product.variants[0];
    }

    if (!variant) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `No variant found for product ${product.title}`);
    }

    let finalPrice = Number(variant.discountedPrice);

    if (product.flashSaleItems && product.flashSaleItems.length > 0) {
       const campaign = product.flashSaleItems[0].flashSaleCampaign;
       finalPrice = calculateFlashSalePrice(finalPrice, campaign.discountType, Number(campaign.discountValue));
    }

    subtotal += finalPrice * item.quantity;

    orderItemsData.push({
      productId: product.id,
      productName: product.title,
      productImage: variant.imageUrl,
      price: finalPrice,
      quantity: item.quantity,
      color: variant.color,
      size: variant.size
    });
  }

  let hasFreeDelivery = false;
  for (const product of products) {
    const isFree = await freeDeliveryService.resolveFreeDeliveryForProduct({
      productId: product.id,
      categoryId: product.categoryId,
      subCategoryId: product.subCategoryId
    });
    if (isFree) {
      hasFreeDelivery = true;
      break;
    }
  }

  let shippingCharge = 0;
  if (!hasFreeDelivery) {
    if (payload.district === 'Inside Dhaka') {
      shippingCharge = 100;
    } else {
      shippingCharge = 150;
    }
  }

  let discountAmount = 0;
  let validPromoCode: string | null = null;

  if (promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: promoCode } });
    if (!promo) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid promo code');
    }
    if (!promo.isActive) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Promo code is disabled');
    }
    if (promo.startDate && now < promo.startDate) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Promo code is not yet active');
    }
    if (promo.endDate && now > promo.endDate) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Promo code is expired');
    }
    if (promo.minOrderValue && new Prisma.Decimal(subtotal).lessThan(promo.minOrderValue)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `Minimum order value of ${promo.minOrderValue} required`);
    }

    const discountValueNum = Number(promo.discountValue);
    if (promo.discountType === 'AMOUNT') {
      discountAmount = discountValueNum;
    } else {
      discountAmount = (subtotal * discountValueNum) / 100;
    }

    if (promo.maxDiscount) {
      const maxDiscountNum = Number(promo.maxDiscount);
      if (discountAmount > maxDiscountNum) {
        discountAmount = maxDiscountNum;
      }
    }

    if (discountAmount > subtotal) {
      discountAmount = subtotal;
    }
    
    validPromoCode = promo.code;
  }

  const total = Math.max(0, subtotal + shippingCharge - discountAmount);
  
  const orderCode = "EC" + Math.floor(10000000 + Math.random() * 90000000).toString();

  const order = await prisma.$transaction(async (tx) => {
    if (validPromoCode) {
      await tx.promoCode.update({
        where: { code: validPromoCode },
        data: { usageCount: { increment: 1 } }
      });
    }

    return tx.order.create({
      data: {
        code: orderCode,
        customerName: payload.customerName,
        customerPhone: payload.customerPhone,
        address: payload.address,
        district: payload.district,
        union: payload.union,
        orderNotes: payload.orderNotes,
        subtotal,
        shippingCharge,
        discountAmount,
        total,
        promoCode: validPromoCode,
        status: 'PENDING',
        items: {
          create: orderItemsData
        }
      },
      include: { items: true }
    });
  });

  return order;
};

const getOrders = async (params: GetOrdersQueryInput) => {
  const { page, limit, search, status } = params;
  const skip = (page - 1) * limit;

  const whereClause: Prisma.OrderWhereInput = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { code: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerPhone: { contains: search, mode: 'insensitive' } }
      ]
    } : {})
  };

  const [data, total] = await prisma.$transaction([
    prisma.order.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { items: true }
    }),
    prisma.order.count({ where: whereClause })
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data
  };
};

const getSingleOrder = async (id: string) => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true }
  });

  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  return order;
};

const updateOrderStatus = async (id: string, status: OrderStatus) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  return prisma.order.update({
    where: { id },
    data: { status },
    include: { items: true }
  });
};

const deleteOrder = async (id: string) => {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Order not found');
  }

  await prisma.order.delete({ where: { id } });
};

export const orderService = {
  checkout,
  getOrders,
  getSingleOrder,
  updateOrderStatus,
  deleteOrder
};