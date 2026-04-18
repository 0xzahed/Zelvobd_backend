import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { freeDeliveryService } from './freeDelivery.service';
import {
  getFreeDeliveryPublicQuerySchema,
  updateFreeDeliveryCampaignSchema,
  updateFreeDeliveryCategorySourceSchema,
  updateFreeDeliveryProductSourceSchema,
  updateFreeDeliverySubCategorySourceSchema
} from './freeDelivery.validation';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getFreeDelivery = catchAsync(async (req, res) => {
  const parsedQuery = getFreeDeliveryPublicQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await freeDeliveryService.getFreeDelivery(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery data fetched successfully',
    data: {
      campaign: result.campaign,
      meta: result.meta,
      products: result.data
    }
  });
});

const getFreeDeliveryAdmin = catchAsync(async (req, res) => {
  const result = await freeDeliveryService.getFreeDeliveryAdmin();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery admin data fetched successfully',
    data: result
  });
});

const updateFreeDeliveryCampaign = catchAsync(async (req, res) => {
  const parsedBody = updateFreeDeliveryCampaignSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await freeDeliveryService.updateFreeDeliveryCampaign(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery campaign updated successfully',
    data: result
  });
});

const updateFreeDeliveryCategories = catchAsync(async (req, res) => {
  const parsedBody = updateFreeDeliveryCategorySourceSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await freeDeliveryService.updateFreeDeliveryCategories(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery categories updated successfully',
    data: result
  });
});

const updateFreeDeliverySubCategories = catchAsync(async (req, res) => {
  const parsedBody = updateFreeDeliverySubCategorySourceSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await freeDeliveryService.updateFreeDeliverySubCategories(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery subcategories updated successfully',
    data: result
  });
});

const updateFreeDeliveryProducts = catchAsync(async (req, res) => {
  const parsedBody = updateFreeDeliveryProductSourceSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await freeDeliveryService.updateFreeDeliveryProducts(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery products updated successfully',
    data: result
  });
});

export const freeDeliveryController = {
  getFreeDelivery,
  getFreeDeliveryAdmin,
  updateFreeDeliveryCampaign,
  updateFreeDeliveryCategories,
  updateFreeDeliverySubCategories,
  updateFreeDeliveryProducts
};
