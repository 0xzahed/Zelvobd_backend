import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { flashSaleService } from './flashsale.service';
import {
  createFlashSaleCampaignSchema,
  getAllActiveFlashSaleProductsQuerySchema,
  getActiveFlashSaleProductsQuerySchema,
  getFlashSaleCampaignListQuerySchema,
  updateFlashSaleCampaignProductsSchema,
  updateFlashSaleCampaignTimeSchema
} from './flashsale.validation';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getFlashSaleCampaignIdFromParams = (req: Request): string => {
  const campaignId = req.params.id;

  if (typeof campaignId !== 'string' || campaignId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid flash sale campaign id is required');
  }

  return campaignId;
};

const createFlashSaleCampaign = catchAsync(async (req, res) => {
  const parsedBody = createFlashSaleCampaignSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const campaign = await flashSaleService.createFlashSaleCampaign(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Flash sale campaign created successfully',
    data: campaign
  });
});

const getFlashSaleCampaignList = catchAsync(async (req, res) => {
  const parsedQuery = getFlashSaleCampaignListQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await flashSaleService.getFlashSaleCampaignList(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Flash sale campaigns fetched successfully',
    data: {
      meta: result.meta,
      campaigns: result.data
    }
  });
});

const getSingleFlashSaleCampaign = catchAsync(async (req, res) => {
  const campaign = await flashSaleService.getSingleFlashSaleCampaign(
    getFlashSaleCampaignIdFromParams(req)
  );

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Flash sale campaign fetched successfully',
    data: campaign
  });
});

const updateFlashSaleCampaignTime = catchAsync(async (req, res) => {
  const parsedBody = updateFlashSaleCampaignTimeSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const campaign = await flashSaleService.updateFlashSaleCampaignTime(
    getFlashSaleCampaignIdFromParams(req),
    parsedBody.data
  );

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Flash sale campaign time updated successfully',
    data: campaign
  });
});

const updateFlashSaleCampaignProducts = catchAsync(async (req, res) => {
  const parsedBody = updateFlashSaleCampaignProductsSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const campaign = await flashSaleService.updateFlashSaleCampaignProducts(
    getFlashSaleCampaignIdFromParams(req),
    parsedBody.data
  );

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Flash sale campaign products updated successfully',
    data: campaign
  });
});

const deleteFlashSaleCampaign = catchAsync(async (req, res) => {
  await flashSaleService.deleteFlashSaleCampaign(getFlashSaleCampaignIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Flash sale campaign deleted successfully',
    data: null
  });
});

const getActiveFlashSaleCampaign = catchAsync(async (req, res) => {
  const campaigns = await flashSaleService.getActiveFlashSaleCampaign();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Active and upcoming flash sale campaigns fetched successfully',
    data: campaigns
  });
});

const getActiveFlashSaleProducts = catchAsync(async (req, res) => {
  const parsedQuery = getActiveFlashSaleProductsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await flashSaleService.getActiveFlashSaleProducts(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Flash sale campaign products fetched successfully',
    data: {
      campaign: result.campaign,
      meta: result.meta,
      products: result.data
    }
  });
});

const getAllActiveFlashSaleProducts = catchAsync(async (req, res) => {
  const parsedQuery = getAllActiveFlashSaleProductsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await flashSaleService.getAllActiveFlashSaleProducts(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'All active flash sale campaign products fetched successfully',
    data: {
      serverTime: result.serverTime,
      campaigns: result.campaigns,
      meta: result.meta,
      products: result.data
    }
  });
});

export const flashSaleController = {
  createFlashSaleCampaign,
  getFlashSaleCampaignList,
  getSingleFlashSaleCampaign,
  updateFlashSaleCampaignTime,
  updateFlashSaleCampaignProducts,
  deleteFlashSaleCampaign,
  getActiveFlashSaleCampaign,
  getActiveFlashSaleProducts,
  getAllActiveFlashSaleProducts
};
