import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { sendResponse } from '../../utils/sendResponse.js';
import { steadfastService } from './steadfast.service.js';

export const checkFraudStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const phone = req.params.phone as string;
    const data = await steadfastService.checkFraudStatus(phone);

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Fraud check completed successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const steadfastController = {
  checkFraudStatus,
};
