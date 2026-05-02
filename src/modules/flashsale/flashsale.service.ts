import { FlashSaleDiscountType } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';
import {
  CreateFlashSaleCampaignInput,
  GetAllActiveFlashSaleProductsQueryInput,
  GetActiveFlashSaleProductsQueryInput,
  GetFlashSaleCampaignListQueryInput,
  UpdateFlashSaleCampaignProductsInput,
  UpdateFlashSaleCampaignTimeInput
} from './flashsale.validation.js';

type FlashSaleCampaignStatus = 'SCHEDULED' | 'ACTIVE' | 'EXPIRED';

const flashSaleCampaignSummarySelect = {
  id: true,
  title: true,
  startAt: true,
  endAt: true,
  discountType: true,
  discountValue: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      products: true
    }
  }
} as const;

const flashSaleCampaignDetailsSelect = {
  ...flashSaleCampaignSummarySelect,
  products: {
    orderBy: {
      createdAt: 'desc' as const
    },
    select: {
      id: true,
      productId: true,
      createdAt: true,
      product: {
        select: {
          id: true,
          title: true,
          slug: true,
          stock: true,
          availability: true,
          isFreeDelivery: true
        }
      }
    }
  }
} as const;

const deduplicateProductIds = (productIds: string[]): string[] => {
  return Array.from(new Set(productIds));
};

const toNumber = (value: number | { toString(): string }): number => {
  return Number(value);
};

const getFlashSaleCampaignStatus = (
  startAt: Date,
  endAt: Date,
  now: Date = new Date()
): FlashSaleCampaignStatus => {
  if (now < startAt) {
    return 'SCHEDULED';
  }

  if (now >= endAt) {
    return 'EXPIRED';
  }

  return 'ACTIVE';
};

const roundToTwoDecimals = (value: number): number => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const getRemainingSeconds = (endAt: Date, now: Date = new Date()): number => {
  return Math.max(0, Math.floor((endAt.getTime() - now.getTime()) / 1000));
};

const getStartsInSeconds = (startAt: Date, now: Date = new Date()): number => {
  return Math.max(0, Math.floor((startAt.getTime() - now.getTime()) / 1000));
};

const mapCampaignSummary = (
  campaign: {
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
    discountType: FlashSaleDiscountType;
    discountValue: { toString(): string } | number;
    createdAt: Date;
    updatedAt: Date;
    _count: { products: number };
  },
  now: Date = new Date()
) => {
  return {
    id: campaign.id,
    title: campaign.title,
    startAt: campaign.startAt,
    endAt: campaign.endAt,
    discountType: campaign.discountType,
    discountValue: toNumber(campaign.discountValue),
    status: getFlashSaleCampaignStatus(campaign.startAt, campaign.endAt, now),
    productCount: campaign._count.products,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt
  };
};

const mapCampaignWithTiming = (
  campaign: Parameters<typeof mapCampaignSummary>[0],
  now: Date = new Date()
) => {
  const mappedCampaign = mapCampaignSummary(campaign, now);

  if (mappedCampaign.status === 'ACTIVE') {
    return {
      ...mappedCampaign,
      remainingSeconds: getRemainingSeconds(campaign.endAt, now)
    };
  }

  if (mappedCampaign.status === 'SCHEDULED') {
    return {
      ...mappedCampaign,
      startsInSeconds: getStartsInSeconds(campaign.startAt, now)
    };
  }

  return {
    ...mappedCampaign,
    remainingSeconds: 0
  };
};

const calculateFlashSalePrice = (
  discountedPrice: number,
  discountType: FlashSaleDiscountType,
  discountValue: number
): number => {
  if (discountType === 'PERCENT') {
    const nextPrice = discountedPrice - (discountedPrice * discountValue) / 100;
    return roundToTwoDecimals(Math.max(nextPrice, 0));
  }

  const nextPrice = discountedPrice - discountValue;
  return roundToTwoDecimals(Math.max(nextPrice, 0));
};

const ensureProductsExist = async (productIds: string[]): Promise<string[]> => {
  const uniqueProductIds = deduplicateProductIds(productIds);

  if (uniqueProductIds.length === 0) {
    return [];
  }

  const existingProducts = await prisma.product.findMany({
    where: {
      id: {
        in: uniqueProductIds
      }
    },
    select: {
      id: true
    }
  });

  if (existingProducts.length !== uniqueProductIds.length) {
    const existingProductIdSet = new Set(existingProducts.map((product) => product.id));
    const missingProductIds = uniqueProductIds.filter((productId) => !existingProductIdSet.has(productId));

    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Products not found: ${missingProductIds.join(', ')}`
    );
  }

  return uniqueProductIds;
};

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
  const categoryExists = await prisma.category.findUnique({
    where: {
      id: categoryId
    },
    select: {
      id: true
    }
  });

  if (!categoryExists) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }
};

const ensureProductsNotAssignedToAnotherCampaign = async (
  productIds: string[],
  excludedCampaignId?: string
): Promise<void> => {
  const uniqueProductIds = deduplicateProductIds(productIds);

  if (uniqueProductIds.length === 0) {
    return;
  }

  const existingAssignments = await prisma.flashSaleProduct.findMany({
    where: {
      productId: {
        in: uniqueProductIds
      },
      ...(excludedCampaignId
        ? {
            flashSaleCampaignId: {
              not: excludedCampaignId
            }
          }
        : {})
    },
    select: {
      productId: true,
      flashSaleCampaign: {
        select: {
          id: true,
          title: true
        }
      }
    }
  });

  if (existingAssignments.length > 0) {
    const campaignByProductId = new Map(
      existingAssignments.map((assignment) => [assignment.productId, assignment.flashSaleCampaign])
    );

    const conflictMessages = Array.from(campaignByProductId.entries()).map(
      ([productId, campaign]) => `${productId} (campaign: ${campaign.title} - ${campaign.id})`
    );

    throw new ApiError(
      StatusCodes.CONFLICT,
      `Products already assigned to another flash sale campaign: ${conflictMessages.join(', ')}`
    );
  }
};

const getActiveAndUpcomingFlashSaleCampaignSummaries = async (now: Date = new Date()) => {
  return prisma.flashSaleCampaign.findMany({
    where: {
      endAt: {
        gt: now
      }
    },
    orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
    select: flashSaleCampaignSummarySelect
  });
};

const getActiveFlashSaleCampaignSummaries = async (now: Date = new Date()) => {
  return prisma.flashSaleCampaign.findMany({
    where: {
      startAt: {
        lte: now
      },
      endAt: {
        gt: now
      }
    },
    orderBy: [{ startAt: 'asc' }, { createdAt: 'desc' }],
    select: flashSaleCampaignSummarySelect
  });
};

const flashSaleProductListSelect = {
  id: true,
  title: true,
  slug: true,
  stock: true,
  availability: true,
  isFreeDelivery: true,
  videoUrl: true,
  category: {
    select: {
      id: true,
      title: true
    }
  },
  subCategory: {
    select: {
      id: true,
      title: true
    }
  },
  variants: {
    orderBy: {
      createdAt: 'asc' as const
    },
    select: {
      id: true,
      actualPrice: true,
      discountedPrice: true,
      color: true,
      size: true,
      imageUrl: true
    }
  }
} as const;

const createFlashSaleCampaign = async (payload: CreateFlashSaleCampaignInput) => {
  if (payload.endAt <= payload.startAt) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'End time must be greater than start time');
  }

  if (payload.endAt <= new Date()) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'End time must be in the future');
  }

  const productIds = await ensureProductsExist(payload.productIds);
  await ensureProductsNotAssignedToAnotherCampaign(productIds);

  const campaign = await prisma.flashSaleCampaign.create({
    data: {
      title: payload.title,
      startAt: payload.startAt,
      endAt: payload.endAt,
      discountType: payload.discountType,
      discountValue: payload.discountValue,
      products: {
        create: productIds.map((productId) => ({
          productId
        }))
      }
    },
    select: flashSaleCampaignDetailsSelect
  });

  return {
    ...mapCampaignSummary(campaign),
    products: campaign.products.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product
    }))
  };
};

const getFlashSaleCampaignList = async (params: GetFlashSaleCampaignListQueryInput) => {
  const { page, limit } = params;
  const skip = (page - 1) * limit;

  const [campaigns, total] = await prisma.$transaction([
    prisma.flashSaleCampaign.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: flashSaleCampaignSummarySelect
    }),
    prisma.flashSaleCampaign.count()
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: campaigns.map((campaign) => mapCampaignSummary(campaign))
  };
};

const getSingleFlashSaleCampaign = async (id: string) => {
  const campaign = await prisma.flashSaleCampaign.findUnique({
    where: { id },
    select: flashSaleCampaignDetailsSelect
  });

  if (!campaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Flash sale campaign not found');
  }

  return {
    ...mapCampaignSummary(campaign),
    products: campaign.products.map((item) => ({
      id: item.id,
      productId: item.productId,
      createdAt: item.createdAt,
      product: item.product
    }))
  };
};

const updateFlashSaleCampaignTime = async (id: string, payload: UpdateFlashSaleCampaignTimeInput) => {
  const existingCampaign = await prisma.flashSaleCampaign.findUnique({
    where: { id },
    select: flashSaleCampaignSummarySelect
  });

  if (!existingCampaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Flash sale campaign not found');
  }

  const nextStartAt = payload.startAt ?? existingCampaign.startAt;
  const nextEndAt = payload.endAt ?? existingCampaign.endAt;

  if (nextEndAt <= nextStartAt) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'End time must be greater than start time');
  }

  const updatedCampaign = await prisma.flashSaleCampaign.update({
    where: { id },
    data: {
      ...(payload.startAt ? { startAt: payload.startAt } : {}),
      ...(payload.endAt ? { endAt: payload.endAt } : {})
    },
    select: flashSaleCampaignSummarySelect
  });

  return mapCampaignSummary(updatedCampaign);
};

const updateFlashSaleCampaignProducts = async (
  id: string,
  payload: UpdateFlashSaleCampaignProductsInput
) => {
  const existingCampaign = await prisma.flashSaleCampaign.findUnique({
    where: { id },
    select: {
      id: true
    }
  });

  if (!existingCampaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Flash sale campaign not found');
  }

  const addProductIds = deduplicateProductIds(payload.addProductIds ?? []);
  const removeProductIds = deduplicateProductIds(payload.removeProductIds ?? []);

  if (addProductIds.length > 0 || removeProductIds.length > 0) {
    await ensureProductsExist([...addProductIds, ...removeProductIds]);
  }

  await ensureProductsNotAssignedToAnotherCampaign(addProductIds, id);

  await prisma.$transaction(async (tx) => {
    if (addProductIds.length > 0) {
      await tx.flashSaleProduct.createMany({
        data: addProductIds.map((productId) => ({
          flashSaleCampaignId: id,
          productId
        })),
        skipDuplicates: true
      });
    }

    if (removeProductIds.length > 0) {
      await tx.flashSaleProduct.deleteMany({
        where: {
          flashSaleCampaignId: id,
          productId: {
            in: removeProductIds
          }
        }
      });
    }
  });

  return getSingleFlashSaleCampaign(id);
};

const deleteFlashSaleCampaign = async (id: string) => {
  const existingCampaign = await prisma.flashSaleCampaign.findUnique({
    where: { id },
    select: {
      id: true
    }
  });

  if (!existingCampaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Flash sale campaign not found');
  }

  await prisma.flashSaleCampaign.delete({
    where: { id }
  });
};

const getActiveFlashSaleCampaign = async () => {
  const now = new Date();
  const campaigns = await getActiveAndUpcomingFlashSaleCampaignSummaries(now);

  return {
    serverTime: now,
    campaigns: campaigns.map((campaign) => mapCampaignWithTiming(campaign, now))
  };
};

const getActiveFlashSaleProducts = async (params: GetActiveFlashSaleProductsQueryInput) => {
  const { campaignId, page, limit, search, categoryId } = params;
  const skip = (page - 1) * limit;
  const now = new Date();

  const campaign = await prisma.flashSaleCampaign.findUnique({
    where: {
      id: campaignId
    },
    select: flashSaleCampaignSummarySelect
  });

  if (!campaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Flash sale campaign not found');
  }

  if (campaign.endAt <= now) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'This flash sale campaign is expired');
  }

  if (categoryId) {
    await ensureCategoryExists(categoryId);
  }

  const whereClause = {
    flashSaleItems: {
      some: {
        flashSaleCampaignId: campaign.id
      }
    },
    ...(search
      ? {
          title: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      : {}),
    ...(categoryId ? { categoryId } : {})
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: flashSaleProductListSelect
    }),
    prisma.product.count({ where: whereClause })
  ]);

  const campaignDiscountValue = toNumber(campaign.discountValue);

  return {
    campaign: {
      ...mapCampaignWithTiming(campaign, now),
      serverTime: now
    },
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => {
        const discountedPrice = toNumber(variant.discountedPrice);

        return {
          ...variant,
          actualPrice: toNumber(variant.actualPrice),
          discountedPrice,
          flashSalePrice: calculateFlashSalePrice(
            discountedPrice,
            campaign.discountType,
            campaignDiscountValue
          )
        };
      })
    }))
  };
};

const getAllActiveFlashSaleProducts = async (params: GetAllActiveFlashSaleProductsQueryInput) => {
  const { page, limit, search, categoryId } = params;
  const skip = (page - 1) * limit;
  const now = new Date();

  const activeCampaigns = await getActiveFlashSaleCampaignSummaries(now);

  if (activeCampaigns.length === 0) {
    return {
      serverTime: now,
      campaigns: [],
      meta: {
        page,
        limit,
        total: 0,
        totalPage: 0
      },
      data: []
    };
  }

  if (categoryId) {
    await ensureCategoryExists(categoryId);
  }

  const activeCampaignIds = activeCampaigns.map((campaign) => campaign.id);

  const whereClause = {
    flashSaleItems: {
      some: {
        flashSaleCampaignId: {
          in: activeCampaignIds
        }
      }
    },
    ...(search
      ? {
          title: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      : {}),
    ...(categoryId ? { categoryId } : {})
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: flashSaleProductListSelect
    }),
    prisma.product.count({ where: whereClause })
  ]);

  const productIds = products.map((product) => product.id);

  const productCampaignAssignments =
    productIds.length > 0
      ? await prisma.flashSaleProduct.findMany({
          where: {
            productId: {
              in: productIds
            },
            flashSaleCampaignId: {
              in: activeCampaignIds
            }
          },
          select: {
            productId: true,
            flashSaleCampaign: {
              select: flashSaleCampaignSummarySelect
            }
          }
        })
      : [];

  const campaignByProductId = new Map<string, (typeof activeCampaigns)[number]>();

  for (const assignment of productCampaignAssignments) {
    if (!campaignByProductId.has(assignment.productId)) {
      campaignByProductId.set(assignment.productId, assignment.flashSaleCampaign);
    }
  }

  return {
    serverTime: now,
    campaigns: activeCampaigns.map((campaign) => mapCampaignWithTiming(campaign, now)),
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: products.map((product) => {
      const relatedCampaign = campaignByProductId.get(product.id);
      const campaignDiscountType = relatedCampaign?.discountType;
      const campaignDiscountValue = relatedCampaign ? toNumber(relatedCampaign.discountValue) : 0;

      return {
        ...product,
        campaign: relatedCampaign ? mapCampaignWithTiming(relatedCampaign, now) : null,
        variants: product.variants.map((variant) => {
          const discountedPrice = toNumber(variant.discountedPrice);

          return {
            ...variant,
            actualPrice: toNumber(variant.actualPrice),
            discountedPrice,
            flashSalePrice:
              campaignDiscountType && relatedCampaign
                ? calculateFlashSalePrice(discountedPrice, campaignDiscountType, campaignDiscountValue)
                : discountedPrice
          };
        })
      };
    })
  };
};

export const flashSaleService = {
  createFlashSaleCampaign,
  getFlashSaleCampaignList,
  getSingleFlashSaleCampaign,
  updateFlashSaleCampaignTime,
  updateFlashSaleCampaignProducts,
  deleteFlashSaleCampaign,
  getActiveFlashSaleCampaign,
  getActiveFlashSaleProducts,
  getAllActiveFlashSaleProducts
};
