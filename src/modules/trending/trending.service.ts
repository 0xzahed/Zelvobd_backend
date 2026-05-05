import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';
import {
  GetTrendingPublicQueryInput,
  UpdateTrendingCampaignInput,
  UpdateTrendingCategorySourceInput,
  UpdateTrendingProductSourceInput,
  UpdateTrendingSubCategorySourceInput
} from './trending.validation.js';

const DEFAULT_TRENDING_CAMPAIGN_KEY = 'GLOBAL';
const DEFAULT_TRENDING_CAMPAIGN_TITLE = 'Trending Campaign';

const trendingCampaignSummarySelect = {
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

const ensureDefaultTrendingCampaign = async (tx: Prisma.TransactionClient) => {
  return tx.trendingCampaign.upsert({
    where: {
      singletonKey: DEFAULT_TRENDING_CAMPAIGN_KEY
    },
    update: {},
    create: {
      singletonKey: DEFAULT_TRENDING_CAMPAIGN_KEY,
      title: DEFAULT_TRENDING_CAMPAIGN_TITLE,
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
    tx.trendingCampaignCategory.findMany({
      where: {
        trendingCampaignId: campaignId
      },
      select: {
        categoryId: true
      }
    }),
    tx.trendingCampaignSubCategory.findMany({
      where: {
        trendingCampaignId: campaignId
      },
      select: {
        subCategoryId: true
      }
    }),
    tx.trendingCampaignProduct.findMany({
      where: {
        trendingCampaignId: campaignId
      },
      select: {
        productId: true
      }
    }),
    tx.trendingCampaignExcludedProduct.findMany({
      where: {
        trendingCampaignId: campaignId
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

const getEffectiveTrendingProductIds = async (
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

const syncAllTrendingProductFlagsTx = async (
  tx: Prisma.TransactionClient,
  campaign: { id: string; isActive: boolean }
): Promise<void> => {
  if (!campaign.isActive) {
    await tx.product.updateMany({
      data: {
        isTrending: false
      }
    });
    return;
  }

  const effectiveProductIds = await getEffectiveTrendingProductIds(tx, campaign);

  await tx.product.updateMany({
    data: {
      isTrending: false
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
        isTrending: true
      }
    });
  }
};

const syncTrendingForProductIdsTx = async (
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
        isTrending: false
      }
    });
    return;
  }

  const effectiveProductIds = await getEffectiveTrendingProductIds(tx, campaign, uniqueProductIds);
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
        isTrending: true
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
        isTrending: false
      }
    });
  }
};

const getCampaignSummaryTx = async (tx: Prisma.TransactionClient, campaignId: string) => {
  const [campaign, freeProductCount] = await Promise.all([
    tx.trendingCampaign.findUnique({
      where: {
        id: campaignId
      },
      select: trendingCampaignSummarySelect
    }),
    tx.product.count({
      where: {
        isTrending: true
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

const getTrendingAdminTx = async (tx: Prisma.TransactionClient, campaignId: string) => {
  const [campaignDetails, campaignSummary] = await Promise.all([
    tx.trendingCampaign.findUnique({
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
                isTrending: true,
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

const getTrending = async (params: GetTrendingPublicQueryInput) => {
  const { page, limit, search, categoryId, subCategoryId } = params;
  const skip = (page - 1) * limit;

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

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
      isTrending: true,
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

    const [products, total, campaignSummary] = await Promise.all([
      tx.product.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          title: true,
          slug: true,
          stock: true,
          availability: true,
          isTrending: true,
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
            take: 1,
            orderBy: {
              createdAt: 'asc'
            },
            select: {
              actualPrice: true,
              discountedPrice: true,
              color: true,
              size: true,
              imageUrl: true
            }
          }
        }
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
        isTrending: product.isTrending,
        category: product.category,
        subCategory: product.subCategory,
        firstVariant: product.variants[0] ?? null
      }))
    };
  });
};

const getTrendingAdmin = async () => {
  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

    return getTrendingAdminTx(tx, campaign.id);
  });
};

const updateTrendingCampaign = async (payload: UpdateTrendingCampaignInput) => {
  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

    const updatedCampaign = await tx.trendingCampaign.update({
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
      await syncAllTrendingProductFlagsTx(tx, updatedCampaign);
    }

    return getCampaignSummaryTx(tx, campaign.id);
  });
};

const updateTrendingCategories = async (payload: UpdateTrendingCategorySourceInput) => {
  const addCategoryIds = await ensureCategoriesExist(payload.addCategoryIds ?? []);
  const removeCategoryIds = await ensureCategoriesExist(payload.removeCategoryIds ?? []);

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

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
      await tx.trendingCampaignCategory.createMany({
        data: addCategoryIds.map((categoryId) => ({
          trendingCampaignId: campaign.id,
          categoryId
        })),
        skipDuplicates: true
      });
    }

    if (removeCategoryIds.length > 0) {
      await tx.trendingCampaignCategory.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          categoryId: {
            in: removeCategoryIds
          }
        }
      });
    }

    if (removeSubCategoryIds.length > 0) {
      await tx.trendingCampaignSubCategory.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          subCategoryId: {
            in: removeSubCategoryIds
          }
        }
      });
    }

    if (removeProductIds.length > 0) {
      await tx.trendingCampaignProduct.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          productId: {
            in: removeProductIds
          }
        }
      });

      await tx.trendingCampaignExcludedProduct.createMany({
        data: removeProductIds.map((productId) => ({
          trendingCampaignId: campaign.id,
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
          isTrending: false
        }
      });
    }

    if (addProductIds.length > 0) {
      await tx.trendingCampaignExcludedProduct.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          productId: {
            in: addProductIds
          }
        }
      });

      await syncTrendingForProductIdsTx(tx, campaign, addProductIds);
    }

    return getTrendingAdminTx(tx, campaign.id);
  });
};

const updateTrendingSubCategories = async (
  payload: UpdateTrendingSubCategorySourceInput
) => {
  const addSubCategoryIds = await ensureSubCategoriesExist(payload.addSubCategoryIds ?? []);
  const removeSubCategoryIds = await ensureSubCategoriesExist(payload.removeSubCategoryIds ?? []);

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

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
      await tx.trendingCampaignSubCategory.createMany({
        data: addSubCategoryIds.map((subCategoryId) => ({
          trendingCampaignId: campaign.id,
          subCategoryId
        })),
        skipDuplicates: true
      });
    }

    if (removeSubCategoryIds.length > 0) {
      await tx.trendingCampaignSubCategory.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          subCategoryId: {
            in: removeSubCategoryIds
          }
        }
      });
    }

    if (removeProductIds.length > 0) {
      await tx.trendingCampaignProduct.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          productId: {
            in: removeProductIds
          }
        }
      });

      await tx.trendingCampaignExcludedProduct.createMany({
        data: removeProductIds.map((productId) => ({
          trendingCampaignId: campaign.id,
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
          isTrending: false
        }
      });
    }

    if (addProductIds.length > 0) {
      await tx.trendingCampaignExcludedProduct.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          productId: {
            in: addProductIds
          }
        }
      });

      await syncTrendingForProductIdsTx(tx, campaign, addProductIds);
    }

    return getTrendingAdminTx(tx, campaign.id);
  });
};

const updateTrendingProducts = async (payload: UpdateTrendingProductSourceInput) => {
  const addProductIds = await ensureProductsExist(payload.addProductIds ?? []);
  const removeProductIds = await ensureProductsExist(payload.removeProductIds ?? []);

  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

    if (addProductIds.length > 0) {
      await tx.trendingCampaignProduct.createMany({
        data: addProductIds.map((productId) => ({
          trendingCampaignId: campaign.id,
          productId
        })),
        skipDuplicates: true
      });

      await tx.trendingCampaignExcludedProduct.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          productId: {
            in: addProductIds
          }
        }
      });

      await syncTrendingForProductIdsTx(tx, campaign, addProductIds);
    }

    if (removeProductIds.length > 0) {
      await tx.trendingCampaignProduct.deleteMany({
        where: {
          trendingCampaignId: campaign.id,
          productId: {
            in: removeProductIds
          }
        }
      });

      await tx.trendingCampaignExcludedProduct.createMany({
        data: removeProductIds.map((productId) => ({
          trendingCampaignId: campaign.id,
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
          isTrending: false
        }
      });
    }

    return getTrendingAdminTx(tx, campaign.id);
  });
};

const syncTrendingForProducts = async (productIds: string[]): Promise<void> => {
  const uniqueProductIds = deduplicateIds(productIds);

  if (uniqueProductIds.length === 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);
    await syncTrendingForProductIdsTx(tx, campaign, uniqueProductIds);
  });
};

const resolveTrendingForProduct = async (params: {
  productId?: string;
  categoryId: string;
  subCategoryId: string;
}): Promise<boolean> => {
  return prisma.$transaction(async (tx) => {
    const campaign = await ensureDefaultTrendingCampaign(tx);

    if (!campaign.isActive) {
      return false;
    }

    const [selectedCategory, selectedSubCategory, selectedProduct, excludedProduct] = await Promise.all([
      tx.trendingCampaignCategory.findUnique({
        where: {
          trendingCampaignId_categoryId: {
            trendingCampaignId: campaign.id,
            categoryId: params.categoryId
          }
        },
        select: {
          id: true
        }
      }),
      tx.trendingCampaignSubCategory.findUnique({
        where: {
          trendingCampaignId_subCategoryId: {
            trendingCampaignId: campaign.id,
            subCategoryId: params.subCategoryId
          }
        },
        select: {
          id: true
        }
      }),
      params.productId
        ? tx.trendingCampaignProduct.findUnique({
            where: {
              trendingCampaignId_productId: {
                trendingCampaignId: campaign.id,
                productId: params.productId
              }
            },
            select: {
              id: true
            }
          })
        : Promise.resolve(null),
      params.productId
        ? tx.trendingCampaignExcludedProduct.findUnique({
            where: {
              trendingCampaignId_productId: {
                trendingCampaignId: campaign.id,
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

export const trendingService = {
  getTrending,
  getTrendingAdmin,
  updateTrendingCampaign,
  updateTrendingCategories,
  updateTrendingSubCategories,
  updateTrendingProducts,
  syncTrendingForProducts,
  resolveTrendingForProduct
};
