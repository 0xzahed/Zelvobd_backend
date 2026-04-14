import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { ApiError } from './ApiError';

export const globalErrorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const statusCode =
    error instanceof ApiError
      ? error.statusCode
      : error instanceof multer.MulterError
        ? StatusCodes.BAD_REQUEST
        : StatusCodes.INTERNAL_SERVER_ERROR;

  const message =
    error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? 'Image size must be less than 5MB'
      : error instanceof Error
        ? error.message
        : 'Something went wrong';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
  });
};
