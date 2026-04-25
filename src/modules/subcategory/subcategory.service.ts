import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';
import { removeLocalFile } from '../../utils/file';
import { resolveStoredRelativePath } from '../../utils/paths';
import { createUniqueSlug } from '../../utils/slug';

type CreateSubCategoryPayload = {
  categoryId: string;
  title: string;
  imageUrl: string;
  imagePath: string;
};

type UpdateSubCategoryPayload = {
  categoryId?: string;
  title?: string;
  imageUrl?: string;
  imagePath?: string;
};

type GetSubCategoryListParams = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
};

const subCategoryPublicSelect = {
  id: true,
  categoryId: true,
  title: true,
  slug: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      title: true
    }
  }
} as const;

const normalizePrismaError = (error: unknown): never => {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiError(StatusCodes.CONFLICT, 'Subcategory title or slug already exists');
  }

  throw error;
};

const ensureCategoryExists = async (categoryId: string): Promise<void> => {
  const existingCategory = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true }
  });

  if (!existingCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }
};

const createSubCategory = async (payload: CreateSubCategoryPayload) => {
  await ensureCategoryExists(payload.categoryId);

  const slug = await createUniqueSlug(payload.title, 'subcategory', async (candidateSlug) => {
    const existingSubCategory = await prisma.subCategory.findUnique({
      where: {
        slug: candidateSlug
      },
      select: {
        id: true
      }
    });

    return Boolean(existingSubCategory);
  });

  try {
    return await prisma.subCategory.create({
      data: {
        ...payload,
        slug
      },
      select: subCategoryPublicSelect
    });
  } catch (error) {
    normalizePrismaError(error);
  }
};

const getSubCategoryList = async (params: GetSubCategoryListParams) => {
  const { page, limit, search, categoryId } = params;
  const skip = (page - 1) * limit;

  const whereClause = {
    ...(categoryId ? { categoryId } : {}),
    ...(search
      ? {
          title: {
            contains: search,
            mode: 'insensitive' as const
          }
        }
      : {})
  };

  const [subCategories, total] = await prisma.$transaction([
    prisma.subCategory.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: subCategoryPublicSelect
    }),
    prisma.subCategory.count({ where: whereClause })
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: subCategories
  };
};

const getSingleSubCategory = async (id: string) => {
  const subCategory = await prisma.subCategory.findUnique({
    where: { id },
    select: subCategoryPublicSelect
  });

  if (!subCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
  }

  return subCategory;
};

const updateSubCategory = async (id: string, payload: UpdateSubCategoryPayload) => {
  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id }
  });

  if (!existingSubCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
  }

  if (payload.categoryId) {
    await ensureCategoryExists(payload.categoryId);
  }

  try {
    const updatedSubCategory = await prisma.subCategory.update({
      where: { id },
      data: payload,
      select: subCategoryPublicSelect
    });

    if (payload.imagePath && existingSubCategory.imagePath !== payload.imagePath) {
      await removeLocalFile(resolveStoredRelativePath(existingSubCategory.imagePath));
    }

    return updatedSubCategory;
  } catch (error) {
    normalizePrismaError(error);
  }
};

const deleteSubCategory = async (id: string) => {
  const existingSubCategory = await prisma.subCategory.findUnique({
    where: { id }
  });

  if (!existingSubCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
  }

  await prisma.subCategory.delete({
    where: { id }
  });

  await removeLocalFile(resolveStoredRelativePath(existingSubCategory.imagePath));
};

export const subCategoryService = {
  createSubCategory,
  getSubCategoryList,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory
};
