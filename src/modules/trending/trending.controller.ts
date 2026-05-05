import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { trendingService } from './trending.service.js';
import {
  getTrendingPublicQuerySchema,
  updateTrendingCampaignSchema,
  updateTrendingCategorySourceSchema,
  updateTrendingProductSourceSchema,
  updateTrendingSubCategorySourceSchema
} from './trending.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getTrending = catchAsync(async (req, res) => {
  const parsedQuery = getTrendingPublicQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await trendingService.getTrending(parsedQuery.data);

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

const getTrendingAdmin = catchAsync(async (req, res) => {
  const result = await trendingService.getTrendingAdmin();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery admin data fetched successfully',
    data: result
  });
});

const updateTrendingCampaign = catchAsync(async (req, res) => {
  const parsedBody = updateTrendingCampaignSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await trendingService.updateTrendingCampaign(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery campaign updated successfully',
    data: result
  });
});

const updateTrendingCategories = catchAsync(async (req, res) => {
  const parsedBody = updateTrendingCategorySourceSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await trendingService.updateTrendingCategories(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery categories updated successfully',
    data: result
  });
});

const updateTrendingSubCategories = catchAsync(async (req, res) => {
  const parsedBody = updateTrendingSubCategorySourceSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await trendingService.updateTrendingSubCategories(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery subcategories updated successfully',
    data: result
  });
});

const updateTrendingProducts = catchAsync(async (req, res) => {
  const parsedBody = updateTrendingProductSourceSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await trendingService.updateTrendingProducts(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Free delivery products updated successfully',
    data: result
  });
});

export const trendingController = {
  getTrending,
  getTrendingAdmin,
  updateTrendingCampaign,
  updateTrendingCategories,
  updateTrendingSubCategories,
  updateTrendingProducts
};
