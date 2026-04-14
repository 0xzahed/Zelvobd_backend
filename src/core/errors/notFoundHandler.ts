import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { sendResponse } from '../../utils/sendResponse';

export const notFoundHandler: RequestHandler = (req, res) => {
  sendResponse(req, res, {
    statusCode: StatusCodes.NOT_FOUND,
    message: `Route not found: ${req.originalUrl}`,
    data: null
  });
};
