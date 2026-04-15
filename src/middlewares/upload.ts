import fs from 'node:fs';
import path from 'node:path';

import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { ApiError } from '../core/errors/ApiError';

const MAX_IMAGE_SIZE_IN_MB = 2;
const MAX_PRODUCT_VIDEO_SIZE_IN_MB = 100;
const MAX_PRODUCT_UPLOAD_SIZE_IN_MB = 100;
const rootUploadDirectoryPath = path.join(process.cwd(), 'upload');

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

ensureDirectoryExists(productImageDirectoryPath);
ensureDirectoryExists(productVideoDirectoryPath);

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

    callback(new ApiError(StatusCodes.BAD_REQUEST, `Unsupported upload field: ${file.fieldname}`), '');
  },
  filename: (_req, file, callback) => {
    callback(null, createSafeFileName(file.originalname, file.fieldname));
  }
});

const productMediaFileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (file.fieldname === 'variantImages') {
    if (!file.mimetype.startsWith('image/')) {
      callback(new ApiError(StatusCodes.BAD_REQUEST, 'Only image files are allowed for variants'));
      return;
    }

    callback(null, true);
    return;
  }

  if (file.fieldname === 'video') {
    if (!file.mimetype.startsWith('video/')) {
      callback(new ApiError(StatusCodes.BAD_REQUEST, 'Only video files are allowed for video field'));
      return;
    }

    callback(null, true);
    return;
  }

  callback(new ApiError(StatusCodes.BAD_REQUEST, `Unsupported upload field: ${file.fieldname}`));
};

export const productMediaUpload = multer({
  storage: productMediaStorage,
  fileFilter: productMediaFileFilter,
  limits: {
    fileSize: MAX_PRODUCT_UPLOAD_SIZE_IN_MB * 1024 * 1024
  }
});

export const categoryImageUpload = createImageUploadMiddleware('categories');
export const subCategoryImageUpload = createImageUploadMiddleware('subCategories');
