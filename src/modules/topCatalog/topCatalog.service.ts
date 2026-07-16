import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';
import {
  GetTopCatalogProductsQueryInput,
  ReplaceTopCatalogCategoriesInput
} from './topCatalog.validation.js';

const deduplicateIds = (ids: string[]): string[] => {
  return Array.from(new Set(ids));
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
    const existingCategoryIdSet = new Set(existingCategories.map((category) => category.id));
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

const getTopCatalogSummary = async () => {
  const catalogCategories = await prisma.topCatalogCategory.findMany({
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
          title: true,
          imageUrl: true
        }
      }
    }
  });

  return {
    totalCategories: catalogCategories.length,
    categories: catalogCategories
  };
};

const replaceTopCatalogCategories = async (payload: ReplaceTopCatalogCategoriesInput) => {
  const nextCategoryIds = await ensureCategoriesExist(payload.categoryIds);

  await prisma.$transaction(async (tx) => {
    const existingCategoryRows = await tx.topCatalogCategory.findMany({
      select: {
        categoryId: true
      }
    });

    const existingCategoryIds = existingCategoryRows.map((row) => row.categoryId);
    const existingCategoryIdSet = new Set(existingCategoryIds);
    const nextCategoryIdSet = new Set(nextCategoryIds);

    const categoryIdsToAdd = nextCategoryIds.filter(
      (categoryId) => !existingCategoryIdSet.has(categoryId)
    );
    const categoryIdsToRemove = existingCategoryIds.filter(
      (categoryId) => !nextCategoryIdSet.has(categoryId)
    );

    if (categoryIdsToAdd.length > 0) {
      await tx.topCatalogCategory.createMany({
        data: categoryIdsToAdd.map((categoryId) => ({
          categoryId
        })),
        skipDuplicates: true
      });
    }

    if (categoryIdsToRemove.length > 0) {
      await tx.topCatalogCategory.deleteMany({
        where: {
          categoryId: {
            in: categoryIdsToRemove
          }
        }
      });
    }
  });

  return getTopCatalogSummary();
};

const getTopCatalogProducts = async (params: GetTopCatalogProductsQueryInput) => {
  const { page, limit, search, categoryId, subCategoryId } = params;
  const skip = (page - 1) * limit;

  const catalogCategories = await prisma.topCatalogCategory.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: {
      categoryId: true,
      category: {
        select: {
          id: true,
          title: true,
          imageUrl: true
        }
      }
    }
  });

  const selectedCategoryIds = catalogCategories.map((item) => item.categoryId);

  if (categoryId) {
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
  }

  if (subCategoryId) {
    const subCategoryExists = await prisma.subCategory.findUnique({
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

  const effectiveCategoryIds = categoryId
    ? selectedCategoryIds.filter((selectedCategoryId) => selectedCategoryId === categoryId)
    : selectedCategoryIds;

  if (effectiveCategoryIds.length === 0) {
    return {
      categories: catalogCategories.map((item) => item.category),
      meta: {
        page,
        limit,
        total: 0,
        totalPage: 0
      },
      data: []
    };
  }

  const whereClause = {
    categoryId: {
      in: effectiveCategoryIds
    },
    availability: true,
    ...(search
      ? {
          title: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      : {}),
    ...(subCategoryId ? { subCategoryId } : {})
  };

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
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
    prisma.product.count({ where: whereClause })
  ]);

  return {
    categories: catalogCategories.map((item) => item.category),
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
};

export const topCatalogService = {
  replaceTopCatalogCategories,
  getTopCatalogProducts
};
