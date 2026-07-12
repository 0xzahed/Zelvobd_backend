import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { orderService } from './order.service.js';
import {
  checkoutSchema,
  getOrdersQuerySchema,
  updateOrderStatusSchema,
  updateOrderSchema,
  landingPageCheckoutSchema
} from './order.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getOrderIdFromParams = (req: Request): string => {
  const orderId = req.params.id;
  if (typeof orderId !== 'string' || orderId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid order id is required');
  }
  return orderId;
};

const checkout = catchAsync(async (req, res) => {
  const parsedBody = checkoutSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const order = await orderService.checkout(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Order placed successfully',
    data: order
  });
});

const checkoutLandingPage = catchAsync(async (req, res) => {
  const parsedBody = landingPageCheckoutSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const order = await orderService.checkoutLandingPage(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Landing page order placed successfully',
    data: order
  });
});

const getOrders = catchAsync(async (req, res) => {
  const parsedQuery = getOrdersQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await orderService.getOrders(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Orders fetched successfully',
    data: {
      meta: result.meta,
      orders: result.data
    }
  });
});

const getSingleOrder = catchAsync(async (req, res) => {
  const orderId = getOrderIdFromParams(req);
  const order = await orderService.getSingleOrder(orderId);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Order fetched successfully',
    data: order
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const parsedBody = updateOrderStatusSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const orderId = getOrderIdFromParams(req);
  const order = await orderService.updateOrderStatus(orderId, parsedBody.data.status);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Order status updated successfully',
    data: order
  });
});

const updateOrder = catchAsync(async (req, res) => {
  const parsedBody = updateOrderSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const orderId = getOrderIdFromParams(req);
  const order = await orderService.updateOrder(orderId, parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Order updated successfully',
    data: order
  });
});

const deleteOrder = catchAsync(async (req, res) => {
  const orderId = getOrderIdFromParams(req);
  await orderService.deleteOrder(orderId);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Order deleted successfully',
    data: null
  });
});

export const orderController = {
  checkout,
  checkoutLandingPage,
  getOrders,
  getSingleOrder,
  updateOrderStatus,
  updateOrder,
  deleteOrder
};
