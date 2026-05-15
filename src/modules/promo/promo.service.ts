import { StatusCodes } from 'http-status-codes';
import { Prisma } from '@prisma/client';
import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';

type CreatePromoPayload = {
  code: string;
  discountType: 'AMOUNT' | 'PERCENT';
  discountValue: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  startDate?: Date | null;
  endDate?: Date | null;
  isActive: boolean;
};

type UpdatePromoPayload = Partial<CreatePromoPayload> & {
    minOrderValue?: number | null;
    maxDiscount?: number | null;
    startDate?: Date | null;
    endDate?: Date | null;
};

type ApplyPromoPayload = {
  code: string;
  orderValue: number;
};

type GetPromosQueryInput = {
  page: number;
  limit: number;
  search?: string;
};

const createPromo = async (payload: CreatePromoPayload) => {
  const existing = await prisma.promoCode.findUnique({ where: { code: payload.code } });
  if (existing) {
    throw new ApiError(StatusCodes.CONFLICT, 'Promo code already exists');
  }

  return prisma.promoCode.create({
    data: payload
  });
};

const getPromos = async (params: GetPromosQueryInput) => {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const whereClause: Prisma.PromoCodeWhereInput = search
    ? { code: { contains: search, mode: 'insensitive' } }
    : {};

  const [data, total] = await prisma.$transaction([
    prisma.promoCode.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.promoCode.count({ where: whereClause })
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

const updatePromo = async (id: string, payload: UpdatePromoPayload) => {
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promo code not found');
  }

  if (payload.code && payload.code !== promo.code) {
    const existing = await prisma.promoCode.findUnique({ where: { code: payload.code } });
    if (existing) {
      throw new ApiError(StatusCodes.CONFLICT, 'Promo code already exists');
    }
  }

  return prisma.promoCode.update({
    where: { id },
    data: payload
  });
};

const deletePromo = async (id: string) => {
  const promo = await prisma.promoCode.findUnique({ where: { id } });
  if (!promo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Promo code not found');
  }

  await prisma.promoCode.delete({ where: { id } });
};

const applyPromo = async (payload: ApplyPromoPayload) => {
  const promo = await prisma.promoCode.findUnique({
    where: { code: payload.code }
  });

  if (!promo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Invalid promo code');
  }

  if (!promo.isActive) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Promo code is disabled');
  }

  const now = new Date();
  if (promo.startDate && now < promo.startDate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Promo code is not yet active');
  }
  if (promo.endDate && now > promo.endDate) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Promo code is expired');
  }

  if (promo.minOrderValue && new Prisma.Decimal(payload.orderValue).lessThan(promo.minOrderValue)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Minimum order value of ${promo.minOrderValue} required`);
  }

  let discountAmount = 0;
  const discountValueNum = promo.discountValue.toNumber();

  if (promo.discountType === 'AMOUNT') {
    discountAmount = discountValueNum;
  } else if (promo.discountType === 'PERCENT') {
    discountAmount = (payload.orderValue * discountValueNum) / 100;
  }

  if (promo.maxDiscount) {
    const maxDiscountNum = promo.maxDiscount.toNumber();
    if (discountAmount > maxDiscountNum) {
      discountAmount = maxDiscountNum;
    }
  }

  if (discountAmount > payload.orderValue) {
    discountAmount = payload.orderValue;
  }

  return {
    code: promo.code,
    discountAmount: Number(discountAmount.toFixed(2)),
    discountType: promo.discountType
  };
};

export const promoService = {
  createPromo,
  getPromos,
  updatePromo,
  deletePromo,
  applyPromo
};
