import fs from 'node:fs';
import path from 'node:path';

import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { ApiError } from '../core/errors/ApiError';

const MAX_IMAGE_SIZE_IN_MB = 2;
const rootUploadDirectoryPath = path.join(process.cwd(), 'upload');

const ensureDirectoryExists = (directoryPath: string): void => {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
};

const createImageUploadMiddleware = (folderName: string) => {
  const targetDirectoryPath = path.join(rootUploadDirectoryPath, folderName);
  ensureDirectoryExists(targetDirectoryPath);

  const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
      callback(null, targetDirectoryPath);
    },
    filename: (_req, file, callback) => {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const fileNameWithoutExtension = file.originalname.replace(fileExtension, '');
      const sanitizedName = fileNameWithoutExtension
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9-_]/g, '')
        .toLowerCase();

      const uniqueFileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${
        sanitizedName || 'image'
      }${fileExtension}`;

      callback(null, uniqueFileName);
    }
  });

  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: MAX_IMAGE_SIZE_IN_MB * 1024 * 1024
    }
  });
};

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new ApiError(StatusCodes.BAD_REQUEST, 'Only image files are allowed'));
    return;
  }

  callback(null, true);
};

export const categoryImageUpload = createImageUploadMiddleware('categories');
export const subCategoryImageUpload = createImageUploadMiddleware('subCategories');
