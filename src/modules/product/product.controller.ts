import sanitizeHtml from 'sanitize-html';
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError';
import {
  PRODUCT_IMAGE_MAX_SIZE_BYTES,
  PRODUCT_VIDEO_MAX_SIZE_BYTES
} from '../../middlewares/upload';
import { catchAsync } from '../../utils/catchAsync';
import { removeLocalFile } from '../../utils/file';
import { sendResponse } from '../../utils/sendResponse';
import { productService } from './product.service';
import { createProductSchema } from './product.validation';

type ProductMediaFiles = {
  variantImages?: Express.Multer.File[];
  video?: Express.Multer.File[];
};

const productFieldRequiredMessageMap: Record<string, string> = {
  categoryId: 'Category is required',
  subCategoryId: 'Subcategory is required',
  title: 'Product title is required',
  descriptionDelta: 'Description delta is required',
  descriptionHtml: 'Description HTML is required',
  extraDescriptionDelta: 'Extra description delta is required',
  extraDescriptionHtml: 'Extra description HTML is required',
  weight: 'Product weight is required',
  material: 'Material is required',
  stock: 'Stock is required',
  availability: 'Availability is required',
  status: 'Status is required',
  variants: 'At least one product variant is required'
};

const variantFieldRequiredMessageMap: Record<string, string> = {
  actualPrice: 'Variant actual price is required',
  discountedPrice: 'Variant discounted price is required',
  color: 'Variant color is required',
  size: 'Variant size is required'
};

const getProductValidationErrorMessage = (error: z.ZodError): string => {
  const firstIssue = error.issues[0];

  if (!firstIssue) {
    return 'Invalid product payload';
  }

  const isMissingFieldError =
    firstIssue.code === 'invalid_type' && firstIssue.message.includes('received undefined');

  if (isMissingFieldError) {
    const topLevelPath = String(firstIssue.path[0] ?? '');

    if (topLevelPath === 'variants') {
      const variantFieldPath = String(firstIssue.path[2] ?? '');
      return variantFieldRequiredMessageMap[variantFieldPath] ?? 'Variant field is required';
    }

    return productFieldRequiredMessageMap[topLevelPath] ?? 'Required field is missing';
  }

  return firstIssue.message ?? 'Invalid product payload';
};

const sanitizeRichTextHtml = (value: string): string => {
  return sanitizeHtml(value, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      '*': ['class'],
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title']
    }
  });
};

const getProductMediaFiles = (req: Request): {
  variantImages: Express.Multer.File[];
  videoFile?: Express.Multer.File;
} => {
  const files = (req.files as ProductMediaFiles | undefined) ?? {};
  const variantImages = files.variantImages ?? [];
  const videoFiles = files.video ?? [];

  return {
    variantImages,
    videoFile: videoFiles[0]
  };
};

const removeUploadedProductMediaFiles = async (req: Request): Promise<void> => {
  const { variantImages, videoFile } = getProductMediaFiles(req);
  const allFiles = [...variantImages, ...(videoFile ? [videoFile] : [])];

  await Promise.all(allFiles.map((file) => removeLocalFile(file.path)));
};

const createProduct = catchAsync(
  async (req, res) => {
    const parsedBody = createProductSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getProductValidationErrorMessage(parsedBody.error));
    }

    const { variantImages, videoFile } = getProductMediaFiles(req);

    if (variantImages.length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'At least one variant image is required');
    }

    if (variantImages.length !== parsedBody.data.variants.length) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Number of variant images must match the number of variants'
      );
    }

    if (variantImages.some((variantImage) => variantImage.size > PRODUCT_IMAGE_MAX_SIZE_BYTES)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Each variant image size must be less than 2MB');
    }

    if (videoFile && videoFile.size > PRODUCT_VIDEO_MAX_SIZE_BYTES) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Video size must be less than 100MB');
    }

    const descriptionHtml = sanitizeRichTextHtml(parsedBody.data.descriptionHtml);
    const extraDescriptionHtml = parsedBody.data.extraDescriptionHtml
      ? sanitizeRichTextHtml(parsedBody.data.extraDescriptionHtml)
      : undefined;

    if (descriptionHtml.trim().length === 0) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Description HTML is invalid after sanitization');
    }

    if (typeof extraDescriptionHtml === 'string' && extraDescriptionHtml.trim().length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Extra description HTML is invalid after sanitization'
      );
    }

    const variantsWithMedia = parsedBody.data.variants.map((variant, index) => {
      const imageFile = variantImages[index];

      if (!imageFile) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Each variant must have exactly one image');
      }

      return {
        ...variant,
        imageUrl: `/upload/products/images/${imageFile.filename}`,
        imagePath: `upload/products/images/${imageFile.filename}`
      };
    });

    const product = await productService.createProduct({
      ...parsedBody.data,
      descriptionHtml,
      extraDescriptionHtml,
      variants: variantsWithMedia,
      videoUrl: videoFile ? `/upload/products/videos/${videoFile.filename}` : undefined,
      videoPath: videoFile ? `upload/products/videos/${videoFile.filename}` : undefined
    });

    sendResponse(req, res, {
      statusCode: StatusCodes.CREATED,
      message: 'Product created successfully',
      data: product
    });
  },
  {
    onError: removeUploadedProductMediaFiles
  }
);

export const productController = {
  createProduct
};
