import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';
import { getProductCardSelect } from '../product/product.service.js';
import {
  GetFreeDeliveryPublicQueryInput,
  UpdateFreeDeliveryCampaignInput,
  UpdateFreeDeliveryCategorySourceInput,
  UpdateFreeDeliveryProductSourceInput,
  UpdateFreeDeliverySubCategorySourceInput
} from './freeDelivery.validation.js';

const DEFAULT_FREE_DELIVERY_CAMPAIGN_KEY = 'GLOBAL';
const DEFAULT_FREE_DELIVERY_CAMPAIGN_TITLE = 'Free Delivery Campaign';

const freeDeliveryCampaignSummarySelect = {
  id: true,
  title: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  _count: {
    select: {
      categories: true,
      subCategories: true,
      products: true,
      excludedProducts: true
    }
  }
} as const;

const deduplicateIds = (ids: string[]): string[] => {
  return Array.from(new Set(ids));
};

const mapIds = <T extends { id: string }>(items: T[]): string[] => {
  return items.map((item) => item.id);
};

const ensureDefaultFreeDeliveryCampaign = async (tx: Prisma.TransactionClient) => {
  return tx.freeDeliveryCampaign.upsert({
    where: {
      singletonKey: DEFAULT_FREE_DELIVERY_CAMPAIGN_KEY
    },
    update: {},
    create: {
      singletonKey: DEFAULT_FREE_DELIVERY_CAMPAIGN_KEY,
      title: DEFAULT_FREE_DELIVERY_CAMPAIGN_TITLE,
      isActive: true
    },
    select: {
      id: true,
      title: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });
};

const ensureCategoriesExist = async (categoryIds: string[]): Promise<string[]> => {
  const uniqueCategoryIds = deduplicateIds(categoryIds);

  if (uniqueCategoryIds.length === 0) {
    return uniqueCategoryIds;
  }

  const existingCategories = await prisma.category.findMany({
    where: {
      id: {
        in: uniqueCategoryIds
      }
    },
    select: {
      id: true
    }
  });

  if (existingCategories.length !== uniqueCategoryIds.length) {
    const existingCategoryIdSet = new Set(mapIds(existingCategories));
    const missingCategoryIds = uniqueCategoryIds.filter(
      (categoryId) => !existingCategoryIdSet.has(categoryId)
    );

    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Categories not found: ${missingCategoryIds.join(', ')}`
    );
  }

  return uniqueCategoryIds;
};

const ensureSubCategoriesExist = async (subCategoryIds: string[]): Promise<string[]> => {
  const uniqueSubCategoryIds = deduplicateIds(subCategoryIds);

  if (uniqueSubCategoryIds.length === 0) {
    return uniqueSubCategoryIds;
  }

  const existingSubCategories = await prisma.subCategory.findMany({
    where: {
      id: {
        in: uniqueSubCategoryIds
      }
    },
    select: {
      id: true
    }
  });

  if (existingSubCategories.length !== uniqueSubCategoryIds.length) {
    const existingSubCategoryIdSet = new Set(mapIds(existingSubCategories));
    const missingSubCategoryIds = uniqueSubCategoryIds.filter(
      (subCategoryId) => !existingSubCategoryIdSet.has(subCategoryId)
    );

    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Subcategories not found: ${missingSubCategoryIds.join(', ')}`
    );
  }

  return uniqueSubCategoryIds;
};

const ensureProductsExist = async (productIds: string[]): Promise<string[]> => {
  const uniqueProductIds = deduplicateIds(productIds);

  if (uniqueProductIds.length === 0) {
    return uniqueProductIds;
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
    const existingProductIdSet = new Set(mapIds(existingProducts));
    const missingProductIds = uniqueProductIds.filter((productId) => !existingProductIdSet.has(productId));

    throw new ApiError(StatusCodes.NOT_FOUND, `Products not found: ${missingProductIds.join(', ')}`);
  }

  return uniqueProductIds;
};

const getCampaignSourceIds = async (tx: Prisma.TransactionClient, campaignId: string) => {
  const [categoryRows, subCategoryRows, productRows, excludedProductRows] = await Promise.all([
    tx.freeDeliveryCampaignCategory.findMany({
      where: {
        freeDeliveryCampaignId: campaignId
      },
      select: {
        categoryId: true
      }
    }),
    tx.freeDeliveryCampaignSubCategory.findMany({
      where: {
        freeDeliveryCampaignId: campaignId
      },
      select: {
        subCategoryId: true
      }
    }),
    tx.freeDeliveryCampaignProduct.findMany({
      where: {
        freeDeliveryCampaignId: campaignId
      },
      select: {
        productId: true
      }
    }),
    tx.freeDeliveryCampaignExcludedProduct.findMany({
      where: {
        freeDeliveryCampaignId: campaignId
      },
      select: {
        productId: true
      }
    })
  ]);

  return {
    categoryIds: categoryRows.map((row) => row.categoryId),
    subCategoryIds: subCategoryRows.map((row) => row.subCategoryId),
    productIds: productRows.map((row) => row.productId),
    excludedProductIds: excludedProductRows.map((row) => row.productId)
  };
};

const getEffectiveFreeDeliveryProductIds = async (
  tx: Prisma.TransactionClient,
  campaign: { id: string; isActive: boolean },
  scopedProductIds?: string[]
): Promise<string[]> => {
  const uniqueScopedProductIds = deduplicateIds(scopedProductIds ?? []);

  if (!campaign.isActive) {
    return [];
  }

  const sourceIds = await getCampaignSourceIds(tx, campaign.id);

  const inclusionConditions: Prisma.ProductWhereInput[] = [];

  if (sourceIds.categoryIds.length > 0) {
    inclusionConditions.push({
      categoryId: {
        in: sourceIds.categoryIds
      }
    });
  }

  if (sourceIds.subCategoryIds.length > 0) {
    inclusionConditions.push({
      subCategoryId: {
        in: sourceIds.subCategoryIds
      }
    });
  }

  if (sourceIds.productIds.length > 0) {
    inclusionConditions.push({
      id: {
        in: sourceIds.productIds
      }
    });
  }

  if (inclusionConditions.length === 0) {
    return [];
  }

  const effectiveProducts = await tx.product.findMany({
    where: {
      ...(uniqueScopedProductIds.length > 0
        ? {
            id: {
              in: uniqueScopedProductIds
            }
          }
        : {}),
      OR: inclusionConditions,
      ...(sourceIds.excludedProductIds.length > 0
        ? {
            id: {
              notIn: sourceIds.excludedProductIds
            }
          }
        : {})
    },
    select: {
      id: true
    }
  });

  return mapIds(effectiveProducts);
};

const syncAllFreeDeliveryProductFlagsTx = async (
  tx: Prisma.TransactionClient,
  campaign: { id: string; isActive: boolean }
): Promise<void> => {
  if (!campaign.isActive) {
    await tx.product.updateMany({
      data: {
        isFreeDelivery: false
      }
    });
    return;
  }

  const effectiveProductIds = await getEffectiveFreeDeliveryProductIds(tx, campaign);

  await tx.product.updateMany({
    data: {
      isFreeDelivery: false
    }
  });

  if (effectiveProductIds.length > 0) {
    await tx.product.updateMany({
      where: {
        id: {
          in: effectiveProductIds
        }
      },
      data: {
        isFreeDelivery: true
      }
    });
  }
};

const syncFreeDeliveryForProductIdsTx = async (
  tx: Prisma.TransactionClient,
  campaign: { id: string; isActive: boolean },
  productIds: string[]
): Promise<void> => {
  const uniqueProductIds = deduplicateIds(productIds);

  if (uniqueProductIds.length === 0) {
    return;
  }

  if (!campaign.isActive) {
    await tx.product.updateMany({
      where: {
        id: {
          in: uniqueProductIds
        }
      },
      data: {
        isFreeDelivery: false
      }
    });
    return;
  }

  const effectiveProductIds = await getEffectiveFreeDeliveryProductIds(tx, campaign, uniqueProductIds);
  const effectiveProductIdSet = new Set(effectiveProductIds);

  const trueProductIds = uniqueProductIds.filter((productId) => effectiveProductIdSet.has(productId));
  const falseProductIds = uniqueProductIds.filter((productId) => !effectiveProductIdSet.has(productId));

  if (trueProductIds.length > 0) {
    await tx.product.updateMany({
      where: {
        id: {
          in: trueProductIds
        }
      },
      data: {
        isFreeDelivery: true
      }
    });
  }

  if (falseProductIds.length > 0) {
    await tx.product.updateMany({
      where: {
        id: {
          in: falseProductIds
        }
      },
      data: {
        isFreeDelivery: false
      }
    });
  }
};

const getCampaignSummaryTx = async (tx: Prisma.TransactionClient, campaignId: string) => {
  const [campaign, freeProductCount] = await Promise.all([
    tx.freeDeliveryCampaign.findUnique({
      where: {
        id: campaignId
      },
      select: freeDeliveryCampaignSummarySelect
    }),
    tx.product.count({
      where: {
        isFreeDelivery: true
      }
    })
  ]);

  if (!campaign) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Free delivery campaign not found');
  }

  return {
    id: campaign.id,
    title: campaign.title,
    isActive: campaign.isActive,
    sourceCounts: {
      categories: campaign._count.categories,
      subCategories: campaign._count.subCategories,
      products: campaign._count.products,
      excludedProducts: campaign._count.excludedProducts
    },
    freeProductCount,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt
  };
};

const getFreeDeliveryAdminTx = async (tx: Prisma.TransactionClient, campaignId: string) => {
  const [campaignDetails, campaignSummary] = await Promise.all([
    tx.freeDeliveryCampaign.findUnique({
      where: {
        id: campaignId
      },
      select: {
        id: true,
        title: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        categories: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            categoryId: true,
            createdAt: true,
            category: {
              select: {
                id: true,
                title: true
              }
            }
          }
        },
        subCategories: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            subCategoryId: true,
            createdAt: true,
            subCategory: {
              select: {
                id: true,
                title: true,
                categoryId: true,
                category: {
                  select: {
                    id: true,
                    title: true
                  }
                }
              }
            }
          }
        },
        products: {
          orderBy: {
            createdAt: 'desc'
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
                isFreeDelivery: true,
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
                }
              }
            }
          }
        },
        excludedProducts: {
          orderBy: {
            createdAt: 'desc'
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
                }
              }
            }
          }
        }
      }
    }),
    getCampaignSummaryTx(tx, campaignId)
  ]);

  if (!campaignDetails) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Free delivery campaign not found');
  }

  return {
    ...campaignSummary,
    sources: {
      categories: campaignDetails.categories,
      subCategories: campaignDetails.subCategories,
      products: campaignDetails.products,
      excludedProducts: campaignDetails.excludedProducts
    }
  };
};

const getFreeDelivery = async (params: GetFreeDeliveryPublicQueryInput) => {
  const { page, limit, search, categoryId, subCategoryId } = params;
  const skip = (page - 1) * limit;

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    if (categoryId) {
      const categoryExists = await tx.category.findUnique({
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
    }

    if (subCategoryId) {
      const subCategoryExists = await tx.subCategory.findUnique({
        where: {
          id: subCategoryId
        },
        select: {
          id: true
        }
      });

      if (!subCategoryExists) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
      }
    }

    const whereClause = {
      isFreeDelivery: true,
      availability: true,
      ...(search
        ? {
            title: {
              contains: search,
              mode: 'insensitive' as const
            }
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(subCategoryId ? { subCategoryId } : {})
    };

    const now = new Date();

    const [products, total, campaignSummary] = await Promise.all([
      tx.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: getProductCardSelect(now)
      }),
      tx.product.count({ where: whereClause }),
      getCampaignSummaryTx(tx, campaign.id)
    ]);

    return {
      campaign: campaignSummary,
      meta: {
        page,
        limit,
        total,
        totalPage: total === 0 ? 0 : Math.ceil(total / limit)
      },
      data: products.map((product) => ({
        id: product.id,
        title: product.title,
        slug: product.slug,
        stock: product.stock,
        availability: product.availability,
        isFreeDelivery: product.isFreeDelivery,
        category: product.category,
        subCategory: product.subCategory,
        firstVariant: product.variants[0] ?? null
      }))
    };
  });
};

const getFreeDeliveryAdmin = async () => {
  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    return getFreeDeliveryAdminTx(tx, campaign.id);
  });
};

const updateFreeDeliveryCampaign = async (payload: UpdateFreeDeliveryCampaignInput) => {
  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    const updatedCampaign = await tx.freeDeliveryCampaign.update({
      where: {
        id: campaign.id
      },
      data: {
        ...(typeof payload.title === 'string' ? { title: payload.title } : {}),
        ...(typeof payload.isActive === 'boolean' ? { isActive: payload.isActive } : {})
      },
      select: {
        id: true,
        isActive: true
      }
    });

    if (typeof payload.isActive === 'boolean' && payload.isActive !== campaign.isActive) {
      await syncAllFreeDeliveryProductFlagsTx(tx, updatedCampaign);
    }

    return getCampaignSummaryTx(tx, campaign.id);
  });
};

const updateFreeDeliveryCategories = async (payload: UpdateFreeDeliveryCategorySourceInput) => {
  const addCategoryIds = await ensureCategoriesExist(payload.addCategoryIds ?? []);
  const removeCategoryIds = await ensureCategoriesExist(payload.removeCategoryIds ?? []);

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    const [addProductRows, removeProductRows, removeSubCategoryRows] = await Promise.all([
      addCategoryIds.length > 0
        ? tx.product.findMany({
            where: {
              categoryId: {
                in: addCategoryIds
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve([]),
      removeCategoryIds.length > 0
        ? tx.product.findMany({
            where: {
              categoryId: {
                in: removeCategoryIds
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve([]),
      removeCategoryIds.length > 0
        ? tx.subCategory.findMany({
            where: {
              categoryId: {
                in: removeCategoryIds
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve([])
    ]);

    const addProductIds = mapIds(addProductRows);
    const removeProductIds = mapIds(removeProductRows);
    const removeSubCategoryIds = mapIds(removeSubCategoryRows);

    if (addCategoryIds.length > 0) {
      await tx.freeDeliveryCampaignCategory.createMany({
        data: addCategoryIds.map((categoryId) => ({
          freeDeliveryCampaignId: campaign.id,
          categoryId
        })),
        skipDuplicates: true
      });
    }

    if (removeCategoryIds.length > 0) {
      await tx.freeDeliveryCampaignCategory.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          categoryId: {
            in: removeCategoryIds
          }
        }
      });
    }

    if (removeSubCategoryIds.length > 0) {
      await tx.freeDeliveryCampaignSubCategory.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          subCategoryId: {
            in: removeSubCategoryIds
          }
        }
      });
    }

    if (removeProductIds.length > 0) {
      await tx.freeDeliveryCampaignProduct.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          productId: {
            in: removeProductIds
          }
        }
      });

      await tx.freeDeliveryCampaignExcludedProduct.createMany({
        data: removeProductIds.map((productId) => ({
          freeDeliveryCampaignId: campaign.id,
          productId
        })),
        skipDuplicates: true
      });

      await tx.product.updateMany({
        where: {
          id: {
            in: removeProductIds
          }
        },
        data: {
          isFreeDelivery: false
        }
      });
    }

    if (addProductIds.length > 0) {
      await tx.freeDeliveryCampaignExcludedProduct.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          productId: {
            in: addProductIds
          }
        }
      });

      await syncFreeDeliveryForProductIdsTx(tx, campaign, addProductIds);
    }

    return getFreeDeliveryAdminTx(tx, campaign.id);
  });
};

const updateFreeDeliverySubCategories = async (
  payload: UpdateFreeDeliverySubCategorySourceInput
) => {
  const addSubCategoryIds = await ensureSubCategoriesExist(payload.addSubCategoryIds ?? []);
  const removeSubCategoryIds = await ensureSubCategoriesExist(payload.removeSubCategoryIds ?? []);

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    const [addProductRows, removeProductRows] = await Promise.all([
      addSubCategoryIds.length > 0
        ? tx.product.findMany({
            where: {
              subCategoryId: {
                in: addSubCategoryIds
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve([]),
      removeSubCategoryIds.length > 0
        ? tx.product.findMany({
            where: {
              subCategoryId: {
                in: removeSubCategoryIds
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve([])
    ]);

    const addProductIds = mapIds(addProductRows);
    const removeProductIds = mapIds(removeProductRows);

    if (addSubCategoryIds.length > 0) {
      await tx.freeDeliveryCampaignSubCategory.createMany({
        data: addSubCategoryIds.map((subCategoryId) => ({
          freeDeliveryCampaignId: campaign.id,
          subCategoryId
        })),
        skipDuplicates: true
      });
    }

    if (removeSubCategoryIds.length > 0) {
      await tx.freeDeliveryCampaignSubCategory.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          subCategoryId: {
            in: removeSubCategoryIds
          }
        }
      });
    }

    if (removeProductIds.length > 0) {
      await tx.freeDeliveryCampaignProduct.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          productId: {
            in: removeProductIds
          }
        }
      });

      await tx.freeDeliveryCampaignExcludedProduct.createMany({
        data: removeProductIds.map((productId) => ({
          freeDeliveryCampaignId: campaign.id,
          productId
        })),
        skipDuplicates: true
      });

      await tx.product.updateMany({
        where: {
          id: {
            in: removeProductIds
          }
        },
        data: {
          isFreeDelivery: false
        }
      });
    }

    if (addProductIds.length > 0) {
      await tx.freeDeliveryCampaignExcludedProduct.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          productId: {
            in: addProductIds
          }
        }
      });

      await syncFreeDeliveryForProductIdsTx(tx, campaign, addProductIds);
    }

    return getFreeDeliveryAdminTx(tx, campaign.id);
  });
};

const updateFreeDeliveryProducts = async (payload: UpdateFreeDeliveryProductSourceInput) => {
  const addProductIds = await ensureProductsExist(payload.addProductIds ?? []);
  const removeProductIds = await ensureProductsExist(payload.removeProductIds ?? []);

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    if (addProductIds.length > 0) {
      await tx.freeDeliveryCampaignProduct.createMany({
        data: addProductIds.map((productId) => ({
          freeDeliveryCampaignId: campaign.id,
          productId
        })),
        skipDuplicates: true
      });

      await tx.freeDeliveryCampaignExcludedProduct.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          productId: {
            in: addProductIds
          }
        }
      });

      await syncFreeDeliveryForProductIdsTx(tx, campaign, addProductIds);
    }

    if (removeProductIds.length > 0) {
      await tx.freeDeliveryCampaignProduct.deleteMany({
        where: {
          freeDeliveryCampaignId: campaign.id,
          productId: {
            in: removeProductIds
          }
        }
      });

      await tx.freeDeliveryCampaignExcludedProduct.createMany({
        data: removeProductIds.map((productId) => ({
          freeDeliveryCampaignId: campaign.id,
          productId
        })),
        skipDuplicates: true
      });

      await tx.product.updateMany({
        where: {
          id: {
            in: removeProductIds
          }
        },
        data: {
          isFreeDelivery: false
        }
      });
    }

    return getFreeDeliveryAdminTx(tx, campaign.id);
  });
};

const syncFreeDeliveryForProducts = async (productIds: string[]): Promise<void> => {
  const uniqueProductIds = deduplicateIds(productIds);

  if (uniqueProductIds.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);
    await syncFreeDeliveryForProductIdsTx(tx, campaign, uniqueProductIds);
  });
};

const resolveFreeDeliveryForProduct = async (params: {
  productId?: string;
  categoryId: string;
  subCategoryId: string;
}): Promise<boolean> => {
  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultFreeDeliveryCampaign(tx);

    if (!campaign.isActive) {
      return false;
    }

    const [selectedCategory, selectedSubCategory, selectedProduct, excludedProduct] = await Promise.all([
      tx.freeDeliveryCampaignCategory.findUnique({
        where: {
          freeDeliveryCampaignId_categoryId: {
            freeDeliveryCampaignId: campaign.id,
            categoryId: params.categoryId
          }
        },
        select: {
          id: true
        }
      }),
      tx.freeDeliveryCampaignSubCategory.findUnique({
        where: {
          freeDeliveryCampaignId_subCategoryId: {
            freeDeliveryCampaignId: campaign.id,
            subCategoryId: params.subCategoryId
          }
        },
        select: {
          id: true
        }
      }),
      params.productId
        ? tx.freeDeliveryCampaignProduct.findUnique({
            where: {
              freeDeliveryCampaignId_productId: {
                freeDeliveryCampaignId: campaign.id,
                productId: params.productId
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve(null),
      params.productId
        ? tx.freeDeliveryCampaignExcludedProduct.findUnique({
            where: {
              freeDeliveryCampaignId_productId: {
                freeDeliveryCampaignId: campaign.id,
                productId: params.productId
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve(null)
    ]);

    if (excludedProduct) {
      return false;
    }

    if (selectedProduct) {
      return true;
    }

    return Boolean(selectedCategory || selectedSubCategory);
  });
};

export const freeDeliveryService = {
  getFreeDelivery,
  getFreeDeliveryAdmin,
  updateFreeDeliveryCampaign,
  updateFreeDeliveryCategories,
  updateFreeDeliverySubCategories,
  updateFreeDeliveryProducts,
  syncFreeDeliveryForProducts,
  resolveFreeDeliveryForProduct
};
