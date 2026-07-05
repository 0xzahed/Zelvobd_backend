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

export const syncOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { orderIds } = req.body;
    
    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return sendResponse(req, res, {
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'orderIds array is required',
        data: null
      });
    }

    const data = await steadfastService.syncOrders(orderIds);

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: `Successfully synced ${data.success} orders to Steadfast`,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const checkDeliveryStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const invoice = req.params.invoice as string;
    const data = await steadfastService.checkDeliveryStatus(invoice);

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Delivery status fetched successfully',
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const steadfastController = {
  checkFraudStatus,
  syncOrders,
  checkDeliveryStatus,
};
