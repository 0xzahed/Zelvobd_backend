import fs from 'node:fs';
import path from 'node:path';

import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { ApiError } from '../core/errors/ApiError';

const uploadDirectoryPath = path.join(process.cwd(), 'upload');

if (!fs.existsSync(uploadDirectoryPath)) {
  fs.mkdirSync(uploadDirectoryPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    callback(null, uploadDirectoryPath);
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

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new ApiError(StatusCodes.BAD_REQUEST, 'Only image files are allowed'));
    return;
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
