import path from 'node:path';
import { createHash } from 'node:crypto';
import { promises as fs, createReadStream } from 'node:fs';

import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';
import { removeLocalFile } from '../../utils/file.js';
import { resolveStoredRelativePath } from '../../utils/paths.js';
import { generateAndSaveBarcode } from '../../utils/barcode.js';
import { freeDeliveryService } from '../freeDelivery/freeDelivery.service.js';
import { trendingService } from '../trending/trending.service.js';
import { CreateProductInput, UpdateProductInput } from './product.validation.js';

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapProductWithFlashSale = (product: any, includeVariants = false) => {
  if (!product) return product;

  let isFlashSale = false;
  let flashSaleEndsAt = null;
  let activeCampaign = null;

  if (product.flashSaleItems && product.flashSaleItems.length > 0) {
    activeCampaign = product.flashSaleItems[0].flashSaleCampaign;
    isFlashSale = true;
    flashSaleEndsAt = activeCampaign.endAt;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mappedVariants = product.variants ? product.variants.map((variant: any) => {
    const actualPrice = Number(variant.actualPrice);
    const discountedPrice = Number(variant.discountedPrice);
    
    let flashSalePrice = undefined;
    if (isFlashSale && activeCampaign) {
       flashSalePrice = calculateFlashSalePrice(
         discountedPrice,
         activeCampaign.discountType,
         Number(activeCampaign.discountValue)
       );
    }

    return {
      ...variant,
      actualPrice,
      discountedPrice,
      flashSalePrice
    };
  }) : [];

  const { flashSaleItems: _flashSaleItems, variants: _variants, ...rest } = product;

  return {
    ...rest,
    isFlashSale,
    flashSaleEndsAt,
    firstVariant: mappedVariants[0] ?? null,
    ...(includeVariants ? { variants: mappedVariants } : {})
  };
};

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

const getProductSelect = (now: Date = new Date()) => ({
  id: true,
  slugId: true,
  categoryId: true,
  subCategoryId: true,
  title: true,
  slug: true,
  brand: true,
  descriptionDelta: true,
  descriptionHtml: true,
  extraDescriptionDelta: true,
  extraDescriptionHtml: true,
  weight: true,
  material: true,
  rating: true,
  stock: true,
  availability: true,
  isFreeDelivery: true,
  isTrending: true,
  videoUrl: true,
  specifications: true,
  variantLabel: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      title: true,
      slug: true
    }
  },
  subCategory: {
    select: {
      id: true,
      title: true,
      slug: true
    }
  },
  variants: {
    orderBy: [
      { createdAt: 'asc' as const },
      { id: 'asc' as const }
    ],
    select: {
      id: true,
      actualPrice: true,
      discountedPrice: true,
      color: true,
      colorCode: true,
      size: true,
      imageUrl: true,
      barcodeUrl: true,
      createdAt: true,
      updatedAt: true
    }
  },
  flashSaleItems: {
    where: {
      flashSaleCampaign: {
        startAt: { lte: now },
        endAt: { gt: now }
      }
    },
    select: {
      flashSaleCampaign: {
        select: {
          id: true,
          discountType: true,
          discountValue: true,
          endAt: true
        }
      }
    }
  }
});

export const getProductCardSelect = (now: Date = new Date()) => ({
  id: true,
  slugId: true,
  slug: true,
  title: true,
  brand: true,
  rating: true,
  stock: true,
  availability: true,
  isFreeDelivery: true,
  isTrending: true,
  createdAt: true,
  category: {
    select: {
      id: true,
      title: true,
      slug: true
    }
  },
  subCategory: {
    select: {
      id: true,
      title: true,
      slug: true
    }
  },
  variants: {
    orderBy: [
      { createdAt: 'asc' as const },
      { id: 'asc' as const }
    ],
    take: 1,
    select: {
      id: true,
      actualPrice: true,
      discountedPrice: true,
      color: true,
      colorCode: true,
      size: true,
      imageUrl: true,
      imagePath: true,
      createdAt: true
    }
  },
  flashSaleItems: {
    where: {
      flashSaleCampaign: {
        startAt: { lte: now },
        endAt: { gt: now }
      }
    },
    select: {
      flashSaleCampaign: {
        select: {
          id: true,
          discountType: true,
          discountValue: true,
          endAt: true
        }
      }
    }
  }
});

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
    resolveStoredRelativePath(originalRelativePath),
    resolveStoredRelativePath(copiedRelativePath)
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
  const firstAbsolutePath = resolveStoredRelativePath(firstRelativePath);
  const secondAbsolutePath = resolveStoredRelativePath(secondRelativePath);

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

/**
 * Fetches slug info needed to build barcode URLs for a product.
 */
const fetchProductSlugInfo = async (productId: string) => {
  return prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      slugId: true,
      title: true,
      slug: true,
      category: { select: { slug: true } },
      subCategory: { select: { slug: true } },
      variants: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, color: true, barcodePath: true }
      }
    }
  });
};

/**
 * Generates barcodes for all variants of a product and saves barcodePath/barcodeUrl
 * to each ProductVariant record. Old barcode files (if any) are deleted first.
 */
const generateBarcodesForProduct = async (productId: string): Promise<void> => {
  const product = await fetchProductSlugInfo(productId);

  if (!product) return;

  const categorySlug = product.category?.slug;
  const subCategorySlug = product.subCategory?.slug;

  if (!categorySlug || !subCategorySlug) return;

  await Promise.all(
    product.variants.map(async (variant) => {
      // Delete old barcode file if one exists
      if (variant.barcodePath) {
        await removeLocalFile(resolveStoredRelativePath(variant.barcodePath));
      }

      const { barcodeUrl, barcodePath } = await generateAndSaveBarcode({
        variantId: variant.id,
        productTitle: product.title,
        productSlugId: product.slugId,
        variantColor: variant.color
      });

      await prisma.productVariant.update({
        where: { id: variant.id },
        data: { barcodeUrl, barcodePath }
      });
    })
  );
};

const extractEmbeddedUploadPaths = (html: string | null | undefined): string[] => {
  if (!html) return [];
  const paths: string[] = [];
  const regex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null) {
    const src = match[1];
    if (src && src.includes('/upload/richText/')) {
      try {
        const urlObj = new URL(src, 'http://localhost');
        const pathname = urlObj.pathname;
        if (pathname.startsWith('/upload/')) {
          paths.push(pathname.substring(1));
        }
      } catch (e) {
        console.log(`Failed to parse URL from img src: ${src}`, e);
      }
    }
  }
  return paths;
};

const createProduct = async (payload: CreateProductPayload) => {
  await ensureCategoryAndSubCategoryRelation(payload.categoryId, payload.subCategoryId);

  try {
    const isFreeDelivery = await freeDeliveryService.resolveFreeDeliveryForProduct({
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId
    });
    const isTrending = await trendingService.resolveTrendingForProduct({
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId
    });

    const extraDescriptionDelta = payload.extraDescriptionDelta as Prisma.InputJsonValue | undefined;
    const createData: Prisma.ProductUncheckedCreateInput = {
      categoryId: payload.categoryId,
      subCategoryId: payload.subCategoryId,
      title: payload.title,
      slug: generateSlug(payload.title),
      brand: payload.brand,
      descriptionDelta: payload.descriptionDelta as Prisma.InputJsonValue,
      descriptionHtml: payload.descriptionHtml,
      extraDescriptionDelta,
      extraDescriptionHtml: payload.extraDescriptionHtml,
      weight: payload.weight,
      material: payload.material ?? null,
      rating: payload.rating ?? null,
      stock: payload.stock ?? true,
      availability: payload.availability,
      variantLabel: payload.variantLabel,
      specifications: payload.specifications ? (payload.specifications as unknown as Prisma.InputJsonValue) : [],
      isFreeDelivery,
      isTrending,
      videoUrl: payload.videoUrl,
      videoPath: payload.videoPath,
      variants: {
        create: payload.variants.map((variant) => ({
          actualPrice: variant.actualPrice,
          discountedPrice: variant.discountedPrice,
          color: variant.color,
          colorCode: variant.colorCode ?? null,
          size: variant.size ?? null,
          imageUrl: variant.imageUrl,
          imagePath: variant.imagePath
        }))
      }
    };

    const product = await prisma.product.create({
      data: createData,
      select: getProductSelect(new Date())
    });

    // Generate barcodes asynchronously after product + variants exist in DB
    generateBarcodesForProduct(product.id).catch((err) => {
      console.error(`[Barcode] Failed to generate barcodes for product ${product.id}:`, err);
    });

    return mapProductWithFlashSale(product);
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

  const now = new Date();

  const [products, total] = await prisma.$transaction([
    prisma.product.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      select: getProductCardSelect(now)
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
    data: products.map((product) => mapProductWithFlashSale(product))
  };
};

const getSingleProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: getProductSelect(new Date())
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return mapProductWithFlashSale(product, true);
};

const getProductBySlug = async (slug: string) => {
  const product = await prisma.product.findUnique({
    where: { slug },
    select: getProductSelect(new Date())
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  return mapProductWithFlashSale(product, true);
};

const updateProduct = async (id: string, payload: UpdateProductPayload) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      brand: true,
      categoryId: true,
      subCategoryId: true,
      descriptionHtml: true,
      extraDescriptionHtml: true,
      videoPath: true,
      videoUrl: true,
      variants: {
        orderBy: {
          createdAt: 'asc'
        },
        select: {
          id: true,
          imagePath: true,
          imageUrl: true,
          barcodePath: true
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
    const nextIsFreeDelivery = await freeDeliveryService.resolveFreeDeliveryForProduct({
      productId: existingProduct.id,
      categoryId: nextCategoryId,
      subCategoryId: nextSubCategoryId
    });
    const nextIsTrending = await trendingService.resolveTrendingForProduct({
      productId: existingProduct.id,
      categoryId: nextCategoryId,
      subCategoryId: nextSubCategoryId
    });

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

    let nextVideoPath = payload.deleteVideo ? null : (payload.videoPath ?? existingProduct.videoPath);
    let nextVideoUrl = payload.deleteVideo ? null : (payload.videoUrl ?? existingProduct.videoUrl);

    if (payload.videoPath && existingProduct.videoPath) {
      const isSameVideo = await areRelativeFilesIdentical(payload.videoPath, existingProduct.videoPath);

      if (isSameVideo) {
        uploadedFilesToDelete.push(payload.videoPath);
        nextVideoPath = existingProduct.videoPath;
        nextVideoUrl = existingProduct.videoUrl;
      }
    }

    const updateData: Prisma.ProductUncheckedUpdateInput = {
      ...(payload.categoryId ? { categoryId: payload.categoryId } : {}),
      ...(payload.subCategoryId ? { subCategoryId: payload.subCategoryId } : {}),
      ...(payload.title
        ? {
            title: payload.title,
            slug: generateSlug(payload.title)
          }
        : {}),
      ...(typeof payload.brand !== 'undefined' ? { brand: payload.brand } : {}),
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
      ...(typeof payload.weight !== 'undefined' ? { weight: payload.weight } : {}),
      ...(typeof payload.material !== 'undefined' ? { material: payload.material } : {}),
      ...(typeof payload.rating !== 'undefined' ? { rating: payload.rating } : {}),
      ...(typeof payload.stock !== 'undefined' ? { stock: payload.stock } : {}),
      ...(typeof payload.availability === 'boolean' ? { availability: payload.availability } : {}),
      ...(typeof payload.variantLabel !== 'undefined' ? { variantLabel: payload.variantLabel } : {}),
      ...(typeof payload.specifications !== 'undefined' ? { specifications: payload.specifications as unknown as Prisma.InputJsonValue } : {}),
      isFreeDelivery: nextIsFreeDelivery,
      isTrending: nextIsTrending,
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
                colorCode: variant.colorCode ?? null,
                size: variant.size ?? null,
                imageUrl: variant.imageUrl,
                imagePath: variant.imagePath
              }))
            }
          }
        : {})
    };

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
      select: getProductSelect(new Date())
    });

    const oldFilePaths: string[] = [...uploadedFilesToDelete];

    if (shouldReplaceVariants) {
      const nextVariantImagePathSet = new Set(nextVariants.map((variant) => variant.imagePath));

      // Delete old variant images that are no longer used
      oldFilePaths.push(
        ...existingProduct.variants
          .filter((variant) => !nextVariantImagePathSet.has(variant.imagePath))
          .map((variant) => variant.imagePath)
      );

      // Delete old barcode files (new ones will be generated)
      oldFilePaths.push(
        ...existingProduct.variants
          .filter((variant) => variant.barcodePath)
          .map((variant) => variant.barcodePath as string)
      );
    }

    if (payload.videoPath && existingProduct.videoPath && nextVideoPath !== existingProduct.videoPath) {
      oldFilePaths.push(existingProduct.videoPath);
    }

    // Diff embedded images to find orphaned ones
    const oldEmbeddedImages = new Set([
      ...extractEmbeddedUploadPaths(existingProduct.descriptionHtml),
      ...extractEmbeddedUploadPaths(existingProduct.extraDescriptionHtml)
    ]);
    const newEmbeddedImages = new Set([
      ...extractEmbeddedUploadPaths(updatedProduct.descriptionHtml),
      ...extractEmbeddedUploadPaths(updatedProduct.extraDescriptionHtml)
    ]);
    
    oldEmbeddedImages.forEach((imagePath) => {
      if (!newEmbeddedImages.has(imagePath)) {
        oldFilePaths.push(imagePath);
      }
    });

    await Promise.all(
      Array.from(new Set(oldFilePaths)).map((filePath) =>
        removeLocalFile(resolveStoredRelativePath(filePath))
      )
    );

    // Regenerate barcodes when variants are replaced OR title changed (label text changes)
    const titleChanged = Boolean(payload.title && payload.title !== existingProduct.title);
    if (shouldReplaceVariants || titleChanged) {
      generateBarcodesForProduct(updatedProduct.id).catch((err) => {
        console.error(`[Barcode] Failed to regenerate barcodes for product ${updatedProduct.id}:`, err);
      });
    }

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
      descriptionHtml: true,
      extraDescriptionHtml: true,
      videoPath: true,
      variants: {
        select: {
          imagePath: true,
          barcodePath: true
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

  const embeddedImages = [
    ...extractEmbeddedUploadPaths(existingProduct.descriptionHtml),
    ...extractEmbeddedUploadPaths(existingProduct.extraDescriptionHtml)
  ];

  const filePathsToDelete = [
    ...existingProduct.variants.map((variant) => variant.imagePath),
    ...existingProduct.variants
      .filter((variant) => variant.barcodePath)
      .map((variant) => variant.barcodePath as string),
    ...(existingProduct.videoPath ? [existingProduct.videoPath] : []),
    ...embeddedImages
  ];

  await Promise.all(
    filePathsToDelete.map((filePath) => removeLocalFile(resolveStoredRelativePath(filePath)))
  );
};

const copyProduct = async (id: string) => {
  const existingProduct = await prisma.product.findUnique({
    where: { id },
    select: {
      categoryId: true,
      subCategoryId: true,
      title: true,
      brand: true,
      descriptionDelta: true,
      descriptionHtml: true,
      extraDescriptionDelta: true,
      extraDescriptionHtml: true,
      weight: true,
      material: true,
      stock: true,
      availability: true,
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
    const copiedIsFreeDelivery = await freeDeliveryService.resolveFreeDeliveryForProduct({
      categoryId: existingProduct.categoryId,
      subCategoryId: existingProduct.subCategoryId
    });
    const copiedIsTrending = await trendingService.resolveTrendingForProduct({
      categoryId: existingProduct.categoryId,
      subCategoryId: existingProduct.subCategoryId
    });

    const copiedVariants = await Promise.all(
      existingProduct.variants.map(async (variant) => {
        const copiedImage = await duplicateLocalMediaFile(variant.imagePath);
        createdCopyFilePaths.push(copiedImage.copiedRelativePath);

        return {
          actualPrice: variant.actualPrice,
          discountedPrice: variant.discountedPrice,
          color: variant.color,
          size: variant.size ?? null,
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
        brand: existingProduct.brand,
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
        isFreeDelivery: copiedIsFreeDelivery,
        isTrending: copiedIsTrending,
        videoPath: copiedVideoPath,
        videoUrl: copiedVideoUrl,
        variants: {
          create: copiedVariants
        }
      },
      select: getProductSelect(new Date())
    });

    // Generate fresh barcodes for the copied product (new slug = different URLs)
    generateBarcodesForProduct(copiedProduct.id).catch((err) => {
      console.error(`[Barcode] Failed to generate barcodes for copied product ${copiedProduct.id}:`, err);
    });

    return copiedProduct;
  } catch (error) {
    await Promise.all(
      createdCopyFilePaths.map((filePath) => removeLocalFile(resolveStoredRelativePath(filePath)))
    );

    normalizePrismaError(error);
  }
};

/**
 * Forces regeneration of all variant barcodes for a product.
 * Useful after a FRONTEND_BASE_URL change or manual admin trigger.
 */
const regenerateProductBarcodes = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    select: { id: true }
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  await generateBarcodesForProduct(id);

  return prisma.product.findUnique({
    where: { id },
    select: getProductSelect(new Date())
  });
};

/**
 * Resolves a scanned barcode string (e.g. P-2026-12-Red) into its frontend redirect URL.
 */
const resolveScannedBarcode = async (barcode: string) => {
  // Format: P-2026-{slugId}-{colorWithHyphens}
  if (!barcode.startsWith('P-2026-')) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid barcode format');
  }

  const parts = barcode.substring(7).split('-');
  if (parts.length < 2) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid barcode format');
  }

  const slugIdStr = parts[0];
  const slugId = parseInt(slugIdStr, 10);
  if (isNaN(slugId)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Invalid product ID in barcode');
  }

  const colorPart = parts.slice(1).join('-'); // Re-join rest of parts as color

  const product = await prisma.product.findUnique({
    where: { slugId },
    select: {
      slug: true,
      category: { select: { slug: true } },
      subCategory: { select: { slug: true } },
      variants: {
        select: {
          id: true,
          color: true
        }
      }
    }
  });

  if (!product) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Product not found');
  }

  // Find variant where color (spaces replaced by hyphens) matches the barcode color
  const variant = product.variants.find((v) => {
    const formattedColor = v.color.trim().replace(/\s+/g, '-');
    return formattedColor === colorPart;
  });

  if (!variant) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Variant not found for this product');
  }

  const categorySlug = product.category?.slug || 'unknown';
  const subCategorySlug = product.subCategory?.slug || 'unknown';

  return {
    redirectUrl: `/${categorySlug}/${subCategorySlug}/${product.slug}/${variant.id}`
  };
};

export const productService = {
  createProduct,
  getProductList,
  getSingleProduct,
  getProductBySlug,
  updateProduct,
  deleteProduct,
  copyProduct,
  regenerateProductBarcodes,
  resolveScannedBarcode
};
