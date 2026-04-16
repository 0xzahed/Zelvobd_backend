import path from 'node:path';
import { createHash } from 'node:crypto';
import { promises as fs, createReadStream } from 'node:fs';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';
import { removeLocalFile } from '../../utils/file';
import { CreateProductInput, UpdateProductInput } from './product.validation';

type CreateProductVariantWithMedia = CreateProductInput['variants'][number] & {
  imageUrl: string;
  imagePath: string;
};

type CreateProductPayload = Omit<CreateProductInput, 'variants'> & {
  variants: CreateProductVariantWithMedia[];
  videoUrl?: string;
  videoPath?: string;
};

type UpdateProductPayload = Omit<UpdateProductInput, 'variants'> & {
  variants?: CreateProductVariantWithMedia[];
  videoUrl?: string;
  videoPath?: string;
};

type GetProductListParams = {
  page: number;
  limit: number;
  search?: string;
  categoryId?: string;
  subCategoryId?: string;
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
    .toLocaleLowerCase()
    .normalize('NFKC')
    .trim()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

  const safeBaseSlug = baseSlug || 'product';
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

  return `${safeBaseSlug}-${suffix}`;
};

const normalizeRelativeFilePath = (relativePath: string): string => {
  return relativePath.split(path.sep).join('/');
};

const relativePathToPublicUrl = (relativePath: string): string => {
  return `/${normalizeRelativeFilePath(relativePath).replace(/^\/+/, '')}`;
};

const duplicateLocalMediaFile = async (
  originalRelativePath: string
): Promise<{ copiedRelativePath: string; copiedPublicUrl: string }> => {
  const parsedOriginalPath = path.parse(originalRelativePath);
  const copiedFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${parsedOriginalPath.name}-copy${parsedOriginalPath.ext}`;
  const copiedRelativePath = normalizeRelativeFilePath(path.join(parsedOriginalPath.dir, copiedFileName));

  await fs.copyFile(
    path.join(process.cwd(), originalRelativePath),
    path.join(process.cwd(), copiedRelativePath)
  );

  return {
    copiedRelativePath,
    copiedPublicUrl: relativePathToPublicUrl(copiedRelativePath)
  };
};

const generateFileHash = async (absoluteFilePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(absoluteFilePath);

    stream.on('data', (chunk) => {
      hash.update(chunk);
    });

    stream.on('error', reject);
    stream.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
};

const areRelativeFilesIdentical = async (
  firstRelativePath: string,
  secondRelativePath: string
): Promise<boolean> => {
  const firstAbsolutePath = path.join(process.cwd(), firstRelativePath);
  const secondAbsolutePath = path.join(process.cwd(), secondRelativePath);

  try {
    const [firstStat, secondStat] = await Promise.all([
      fs.stat(firstAbsolutePath),
      fs.stat(secondAbsolutePath)
    ]);

    if (firstStat.size !== secondStat.size) {
      return false;
    }

    const [firstHash, secondHash] = await Promise.all([
      generateFileHash(firstAbsolutePath),
      generateFileHash(secondAbsolutePath)
    ]);

    return firstHash === secondHash;
  } catch {
    return false;
  }
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

const getProductList = async (params: GetProductListParams) => {
  const { page, limit, search, categoryId, subCategoryId } = params;
  const skip = (page - 1) * limit;

  const whereClause = {
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
        stock: true,
        availability: true,
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
    meta: {
      page,
      limit,
      total,
      totalPage: total === 0 ? 0 : Math.ceil(total / limit)
    },
    data: products.map((product) => ({
      id: product.id,
      title: product.title,
      stock: product.stock,
      availability: product.availability,
      category: product.category,
      subCategory: product.subCategory,
      firstVariant: product.variants[0] ?? null
    }))
  };
};

const getSingleProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: productSelect
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return product;
};

const updateProduct = async (id: string, payload: UpdateProductPayload) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      categoryId: true,
      subCategoryId: true,
      videoPath: true,
      videoUrl: true,
      variants: {
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          imagePath: true,
          imageUrl: true
        }
      }
    }
  });

  if (!existingProduct) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const nextCategoryId = payload.categoryId ?? existingProduct.categoryId;
  const nextSubCategoryId = payload.subCategoryId ?? existingProduct.subCategoryId;

  await ensureCategoryAndSubCategoryRelation(nextCategoryId, nextSubCategoryId);

  try {
    const extraDescriptionDelta = payload.extraDescriptionDelta as Prisma.InputJsonValue | undefined;
    const nextVariantsFromPayload = payload.variants;
    const shouldReplaceVariants = Array.isArray(nextVariantsFromPayload);
    let nextVariants: CreateProductVariantWithMedia[] = shouldReplaceVariants
      ? nextVariantsFromPayload
      : [];

    const uploadedFilesToDelete: string[] = [];

    if (shouldReplaceVariants && nextVariants.length === existingProduct.variants.length) {
      nextVariants = await Promise.all(
        nextVariants.map(async (variant, index) => {
          const existingVariant = existingProduct.variants[index];

          if (!existingVariant) {
            return variant;
          }

          const isSameFile = await areRelativeFilesIdentical(variant.imagePath, existingVariant.imagePath);

          if (!isSameFile) {
            return variant;
          }

          uploadedFilesToDelete.push(variant.imagePath);

          return {
            ...variant,
            imagePath: existingVariant.imagePath,
            imageUrl: existingVariant.imageUrl
          };
        })
      );
    }

    let nextVideoPath = payload.videoPath ?? existingProduct.videoPath;
    let nextVideoUrl = payload.videoUrl ?? existingProduct.videoUrl;

    if (payload.videoPath && existingProduct.videoPath) {
      const isSameVideo = await areRelativeFilesIdentical(payload.videoPath, existingProduct.videoPath);

      if (isSameVideo) {
        uploadedFilesToDelete.push(payload.videoPath);
        nextVideoPath = existingProduct.videoPath;
        nextVideoUrl = existingProduct.videoUrl;
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
        ...(payload.subCategoryId ? { subCategoryId: payload.subCategoryId } : {}),
        ...(payload.title
          ? {
              title: payload.title,
              slug: generateSlug(payload.title)
            }
          : {}),
        ...(payload.descriptionDelta
          ? { descriptionDelta: payload.descriptionDelta as Prisma.InputJsonValue }
          : {}),
        ...(typeof payload.descriptionHtml === 'string'
          ? { descriptionHtml: payload.descriptionHtml }
          : {}),
        ...(typeof payload.extraDescriptionDelta !== 'undefined' ? { extraDescriptionDelta } : {}),
        ...(typeof payload.extraDescriptionHtml !== 'undefined'
          ? { extraDescriptionHtml: payload.extraDescriptionHtml }
          : {}),
        ...(payload.weight ? { weight: payload.weight } : {}),
        ...(payload.material ? { material: payload.material } : {}),
        ...(typeof payload.stock === 'boolean' ? { stock: payload.stock } : {}),
        ...(typeof payload.availability === 'boolean' ? { availability: payload.availability } : {}),
        ...(payload.status ? { status: payload.status } : {}),
        videoUrl: nextVideoUrl,
        videoPath: nextVideoPath,
        ...(shouldReplaceVariants
          ? {
              variants: {
                deleteMany: {},
                create: nextVariants.map((variant) => ({
                  actualPrice: variant.actualPrice,
                  discountedPrice: variant.discountedPrice,
                  color: variant.color,
                  size: variant.size,
                  imageUrl: variant.imageUrl,
                  imagePath: variant.imagePath
                }))
              }
            }
          : {})
      },
      select: productSelect
    });

    const oldFilePaths: string[] = [...uploadedFilesToDelete];

    if (shouldReplaceVariants) {
      const nextVariantImagePathSet = new Set(nextVariants.map((variant) => variant.imagePath));

      oldFilePaths.push(
        ...existingProduct.variants
          .filter((variant) => !nextVariantImagePathSet.has(variant.imagePath))
          .map((variant) => variant.imagePath)
      );
    }

    if (payload.videoPath && existingProduct.videoPath && nextVideoPath !== existingProduct.videoPath) {
      oldFilePaths.push(existingProduct.videoPath);
    }

    await Promise.all(
      Array.from(new Set(oldFilePaths)).map((filePath) =>
        removeLocalFile(path.join(process.cwd(), filePath))
      )
    );

    return updatedProduct;
  } catch (error) {
    normalizePrismaError(error);
  }
};

const deleteProduct = async (id: string) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      videoPath: true,
      variants: {
        select: {
          imagePath: true
        }
      }
    }
  });

  if (!existingProduct) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  await prisma.product.delete({
    where: { id }
  });

  const filePathsToDelete = [
    ...existingProduct.variants.map((variant) => variant.imagePath),
    ...(existingProduct.videoPath ? [existingProduct.videoPath] : [])
  ];

  await Promise.all(
    filePathsToDelete.map((filePath) => removeLocalFile(path.join(process.cwd(), filePath)))
  );
};

const copyProduct = async (id: string) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: {
      categoryId: true,
      subCategoryId: true,
      title: true,
      descriptionDelta: true,
      descriptionHtml: true,
      extraDescriptionDelta: true,
      extraDescriptionHtml: true,
      weight: true,
      material: true,
      stock: true,
      availability: true,
      status: true,
      videoPath: true,
      variants: {
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          actualPrice: true,
          discountedPrice: true,
          color: true,
          size: true,
          imagePath: true
        }
      }
    }
  });

  if (!existingProduct) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  const createdCopyFilePaths: string[] = [];

  try {
    const copiedVariants = await Promise.all(
      existingProduct.variants.map(async (variant) => {
        const copiedImage = await duplicateLocalMediaFile(variant.imagePath);
        createdCopyFilePaths.push(copiedImage.copiedRelativePath);

        return {
          actualPrice: variant.actualPrice,
          discountedPrice: variant.discountedPrice,
          color: variant.color,
          size: variant.size,
          imagePath: copiedImage.copiedRelativePath,
          imageUrl: copiedImage.copiedPublicUrl
        };
      })
    );

    let copiedVideoPath: string | undefined;
    let copiedVideoUrl: string | undefined;

    if (existingProduct.videoPath) {
      const copiedVideo = await duplicateLocalMediaFile(existingProduct.videoPath);
      copiedVideoPath = copiedVideo.copiedRelativePath;
      copiedVideoUrl = copiedVideo.copiedPublicUrl;
      createdCopyFilePaths.push(copiedVideoPath);
    }

    const copiedProduct = await prisma.product.create({
      data: {
        categoryId: existingProduct.categoryId,
        subCategoryId: existingProduct.subCategoryId,
        title: existingProduct.title,
        slug: generateSlug(existingProduct.title),
        descriptionDelta: existingProduct.descriptionDelta as Prisma.InputJsonValue,
        descriptionHtml: existingProduct.descriptionHtml,
        extraDescriptionDelta:
          existingProduct.extraDescriptionDelta === null
            ? Prisma.JsonNull
            : (existingProduct.extraDescriptionDelta as Prisma.InputJsonValue),
        extraDescriptionHtml: existingProduct.extraDescriptionHtml,
        weight: existingProduct.weight,
        material: existingProduct.material,
        stock: existingProduct.stock,
        availability: existingProduct.availability,
        status: existingProduct.status,
        videoPath: copiedVideoPath,
        videoUrl: copiedVideoUrl,
        variants: {
          create: copiedVariants
        }
      },
      select: productSelect
    });

    return copiedProduct;
  } catch (error) {
    await Promise.all(
      createdCopyFilePaths.map((filePath) => removeLocalFile(path.join(process.cwd(), filePath)))
    );

    normalizePrismaError(error);
  }
};

export const productService = {
  createProduct,
  getProductList,
  getSingleProduct,
  updateProduct,
  deleteProduct,
  copyProduct
};
