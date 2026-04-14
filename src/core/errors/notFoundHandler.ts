import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`
  });
};
