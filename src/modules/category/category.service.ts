import path from 'node:path';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';
import { removeLocalFile } from '../../utils/file';

type CreateCategoryPayload = {
  title: string;
  imageUrl: string;
  imagePath: string;
};

type UpdateCategoryPayload = {
  title?: string;
  imageUrl?: string;
  imagePath?: string;
};

type GetCategoryListParams = {
  page: number;
  limit: number;
  search?: string;
};

const categoryPublicSelect = {
  id: true,
  title: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true
} as const;

const normalizePrismaError = (error: unknown): never => {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiError(StatusCodes.CONFLICT, 'Category title already exists');
  }

  throw error;
};

const createCategory = async (payload: CreateCategoryPayload) => {
  try {
    return await prisma.category.create({
      data: payload,
      select: categoryPublicSelect
    });
  } catch (error) {
    normalizePrismaError(error);
  }
};

const getCategoryList = async (params: GetCategoryListParams) => {
  const { page, limit, search } = params;
  const skip = (page - 1) * limit;

  const whereClause = search
    ? {
        title: {
          contains: search,
          mode: 'insensitive' as const
        }
      }
    : undefined;

  const [categories, total] = await prisma.$transaction([
    prisma.category.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: categoryPublicSelect
    }),
    prisma.category.count({ where: whereClause })
  ]);

  return {
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: categories
  };
};

const getSingleCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    select: categoryPublicSelect
  });

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  return category;
};

const updateCategory = async (id: string, payload: UpdateCategoryPayload) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id }
  });

  if (!existingCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  try {
    const updatedCategory = await prisma.category.update({
      where: { id },
      data: payload,
      select: categoryPublicSelect
    });

    if (payload.imagePath && existingCategory.imagePath !== payload.imagePath) {
      await removeLocalFile(path.join(process.cwd(), existingCategory.imagePath));
    }

    return updatedCategory;
  } catch (error) {
    normalizePrismaError(error);
  }
};

const deleteCategory = async (id: string) => {
  const existingCategory = await prisma.category.findUnique({
    where: { id }
  });

  if (!existingCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  await prisma.category.delete({
    where: { id }
  });

  await removeLocalFile(path.join(process.cwd(), existingCategory.imagePath));
};

export const categoryService = {
  createCategory,
  getCategoryList,
  getSingleCategory,
  updateCategory,
  deleteCategory
};
