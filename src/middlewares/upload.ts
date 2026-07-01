import fs from 'node:fs';
import path from 'node:path';

import type { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import sharp from 'sharp';

import { ApiError } from '../core/errors/ApiError.js';
import { uploadRootPath } from '../utils/paths.js';

const MAX_IMAGE_SIZE_IN_MB = 20;
const MAX_PRODUCT_VIDEO_SIZE_IN_MB = 100;
const MAX_PRODUCT_UPLOAD_SIZE_IN_MB = 100;
const rootUploadDirectoryPath = uploadRootPath;

export const PRODUCT_IMAGE_MAX_SIZE_BYTES = MAX_IMAGE_SIZE_IN_MB * 1024 * 1024;
export const PRODUCT_VIDEO_MAX_SIZE_BYTES = MAX_PRODUCT_VIDEO_SIZE_IN_MB * 1024 * 1024;

const ensureDirectoryExists = (directoryPath: string): void => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const createSafeFileName = (originalFileName: string, fallback: string): string => {
  const fileExtension = path.extname(originalFileName).toLowerCase();
  const fileNameWithoutExtension = originalFileName.replace(fileExtension, '');
  const sanitizedName = fileNameWithoutExtension
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-_]/g, '')
    .toLowerCase();

  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedName || fallback}${fileExtension}`;
};

const imageOnlyFileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new ApiError(StatusCodes.BAD_REQUEST, 'Only image files are allowed'));
    return;
  }

  callback(null, true);
};

const createImageUploadMiddleware = (folderName: string) => {
  const targetDirectoryPath = path.join(rootUploadDirectoryPath, folderName);
  ensureDirectoryExists(targetDirectoryPath);

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, targetDirectoryPath);
    },
    filename: (_req, file, callback) => {
      callback(null, createSafeFileName(file.originalname, 'image'));
    }
  });

  return multer({
    storage,
    fileFilter: imageOnlyFileFilter,
    limits: {
      fileSize: MAX_IMAGE_SIZE_IN_MB * 1024 * 1024
    }
  });
};

const productMediaDirectoryPath = path.join(rootUploadDirectoryPath, 'products');
const productImageDirectoryPath = path.join(productMediaDirectoryPath, 'images');
const productVideoDirectoryPath = path.join(productMediaDirectoryPath, 'videos');
const productBarcodeDirectoryPath = path.join(productMediaDirectoryPath, 'barcodes');

ensureDirectoryExists(productImageDirectoryPath);
ensureDirectoryExists(productVideoDirectoryPath);
ensureDirectoryExists(productBarcodeDirectoryPath);

const productMediaStorage = multer.diskStorage({
  destination: (_req, file, callback) => {
    if (file.fieldname === 'video') {
      callback(null, productVideoDirectoryPath);
      return;
    }

    if (file.fieldname === 'variantImages') {
      callback(null, productImageDirectoryPath);
      return;
    }

    callback(
      new ApiError(
        StatusCodes.BAD_REQUEST,
        `Unsupported upload field: ${file.fieldname}`
      ),
      ''
    );
  },
  filename: (_req, file, callback) => {
    callback(null, createSafeFileName(file.originalname, file.fieldname));
  }
});

const productMediaFileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (file.fieldname === 'variantImages') {
    if (!file.mimetype.startsWith('image/')) {
      callback(
        new ApiError(StatusCodes.BAD_REQUEST, 'Only image files are allowed for variants')
      );
      return;
    }

    callback(null, true);
    return;
  }

  if (file.fieldname === 'video') {
    if (!file.mimetype.startsWith('video/')) {
      callback(
        new ApiError(
          StatusCodes.BAD_REQUEST,
          'Only video files are allowed for video field'
        )
      );
      return;
    }

    callback(null, true);
    return;
  }

  callback(
    new ApiError(StatusCodes.BAD_REQUEST, `Unsupported upload field: ${file.fieldname}`)
  );
};

const processImage = async (file: Express.Multer.File) => {
  if (!file.mimetype.startsWith('image/')) return;
  if (file.mimetype === 'image/webp' || file.mimetype === 'image/svg+xml') return; // Skip if already optimal

  const originalPath = file.path;
  const parsed = path.parse(originalPath);
  const newFilename = parsed.name + '.webp';
  const newPath = path.join(parsed.dir, newFilename);

  // Resize and convert to WebP
  await sharp(originalPath)
    .resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(newPath);

  // Delete original file
  fs.unlinkSync(originalPath);

  // Update file object for downstream controllers
  file.path = newPath;
  file.filename = newFilename;
  file.mimetype = 'image/webp';
  file.size = fs.statSync(newPath).size;
};

export const optimizeUploadedImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const promises: Promise<void>[] = [];

    if (req.file) {
      promises.push(processImage(req.file));
    } else if (req.files) {
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          promises.push(processImage(file));
        }
      } else {
        for (const field in req.files) {
          for (const file of req.files[field]) {
            promises.push(processImage(file));
          }
        }
      }
    }

    await Promise.all(promises);
    next();
  } catch (error) {
    next(error);
  }
};

const wrapUpload = (multerInstance: multer.Multer) => ({
  single: (fieldName: string) => [
    multerInstance.single(fieldName),
    optimizeUploadedImages
  ],
  array: (fieldName: string, maxCount?: number) => [
    multerInstance.array(fieldName, maxCount),
    optimizeUploadedImages
  ],
  fields: (fields: multer.Field[]) => [
    multerInstance.fields(fields),
    optimizeUploadedImages
  ]
});

export const productMediaUpload = wrapUpload(
  multer({
    storage: productMediaStorage,
    fileFilter: productMediaFileFilter,
    limits: {
      fileSize: MAX_PRODUCT_UPLOAD_SIZE_IN_MB * 1024 * 1024
    }
  })
);

export const categoryImageUpload = wrapUpload(createImageUploadMiddleware('categories'));
export const subCategoryImageUpload = wrapUpload(
  createImageUploadMiddleware('subCategories')
);
export const bannerImageUpload = wrapUpload(createImageUploadMiddleware('banners'));
export const richTextImageUpload = wrapUpload(createImageUploadMiddleware('richText'));
export const youtubeVideoImageUpload = wrapUpload(
  createImageUploadMiddleware('youtubeVideos')
);
