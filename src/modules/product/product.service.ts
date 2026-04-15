import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';
import { CreateProductInput } from './product.validation';

type CreateProductVariantWithMedia = CreateProductInput['variants'][number] & {
  imageUrl: string;
  imagePath: string;
};

type CreateProductPayload = Omit<CreateProductInput, 'variants'> & {
  variants: CreateProductVariantWithMedia[];
  videoUrl?: string;
  videoPath?: string;
};

const productSelect = {
  id: true,
  categoryId: true,
  subCategoryId: true,
  title: true,
  slug: true,
  descriptionDelta: true,
  descriptionHtml: true,
  extraDescriptionDelta: true,
  extraDescriptionHtml: true,
  weight: true,
  material: true,
  stock: true,
  availability: true,
  status: true,
  videoUrl: true,
  createdAt: true,
  updatedAt: true,
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
      imageUrl: true,
      createdAt: true,
      updatedAt: true
    }
  }
} as const;

const generateSlug = (title: string): string => {
  const baseSlug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  const safeBaseSlug = baseSlug || 'product';
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  return `${safeBaseSlug}-${suffix}`;
};

const ensureCategoryAndSubCategoryRelation = async (
  categoryId: string,
  subCategoryId: string
): Promise<void> => {
  const [category, subCategory] = await prisma.$transaction([
    prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true }
    }),
    prisma.subCategory.findUnique({
      where: { id: subCategoryId },
      select: { id: true, categoryId: true }
    })
  ]);

  if (!category) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  if (!subCategory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Subcategory not found');
  }

  if (subCategory.categoryId !== categoryId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      'Selected subcategory does not belong to the selected category'
    );
  }
};

const normalizePrismaError = (error: unknown): never => {
  if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
    throw new ApiError(StatusCodes.CONFLICT, 'Unable to generate unique product slug. Please retry');
  }

  throw error;
};

const createProduct = async (payload: CreateProductPayload) => {
  await ensureCategoryAndSubCategoryRelation(payload.categoryId, payload.subCategoryId);

  try {
    const extraDescriptionDelta = payload.extraDescriptionDelta as Prisma.InputJsonValue | undefined;

    const product = await prisma.product.create({
      data: {
        categoryId: payload.categoryId,
        subCategoryId: payload.subCategoryId,
        title: payload.title,
        slug: generateSlug(payload.title),
        descriptionDelta: payload.descriptionDelta as Prisma.InputJsonValue,
        descriptionHtml: payload.descriptionHtml,
        extraDescriptionDelta,
        extraDescriptionHtml: payload.extraDescriptionHtml,
        weight: payload.weight,
        material: payload.material,
        stock: payload.stock,
        availability: payload.availability,
        status: payload.status,
        videoUrl: payload.videoUrl,
        videoPath: payload.videoPath,
        variants: {
          create: payload.variants.map((variant) => ({
            actualPrice: variant.actualPrice,
            discountedPrice: variant.discountedPrice,
            color: variant.color,
            size: variant.size,
            imageUrl: variant.imageUrl,
            imagePath: variant.imagePath
          }))
        }
      },
      select: productSelect
    });

    return product;
  } catch (error) {
    normalizePrismaError(error);
  }
};

export const productService = {
  createProduct
};
