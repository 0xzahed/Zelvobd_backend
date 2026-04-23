import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';

import { ApiError } from './ApiError';
import { sendResponse } from '../../utils/sendResponse';

export const globalErrorHandler: ErrorRequestHandler = (error, req, res, _next) => {
  const statusCode =
    error instanceof ApiError
      ? error.statusCode
      : error instanceof multer.MulterError
        ? StatusCodes.BAD_REQUEST
        : StatusCodes.INTERNAL_SERVER_ERROR;

  const message =
    error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE'
      ? error.field === 'video'
        ? 'Video size must be less than 100MB'
        : 'Image size must be less than 20MB'
      : error instanceof Error
        ? error.message
        : 'Something went wrong';

  sendResponse(req, res, {
    statusCode,
    message,
    data: null
  });
};
