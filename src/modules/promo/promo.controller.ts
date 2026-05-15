import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { promoService } from './promo.service.js';
import {
  createPromoSchema,
  updatePromoSchema,
  applyPromoSchema,
  getPromosQuerySchema
} from './promo.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getPromoIdFromParams = (req: Request): string => {
  const promoId = req.params.id;
  if (typeof promoId !== 'string' || promoId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid promo id is required');
  }
  return promoId;
};

const createPromo = catchAsync(async (req, res) => {
  const parsedBody = createPromoSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const promo = await promoService.createPromo(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Promo code created successfully',
    data: promo
  });
});

const getPromos = catchAsync(async (req, res) => {
  const parsedQuery = getPromosQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await promoService.getPromos(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Promo codes fetched successfully',
    data: {
      meta: result.meta,
      promos: result.data
    }
  });
});

const updatePromo = catchAsync(async (req, res) => {
  const parsedBody = updatePromoSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const promoId = getPromoIdFromParams(req);
  const promo = await promoService.updatePromo(promoId, parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Promo code updated successfully',
    data: promo
  });
});

const deletePromo = catchAsync(async (req, res) => {
  const promoId = getPromoIdFromParams(req);
  await promoService.deletePromo(promoId);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Promo code deleted successfully',
    data: null
  });
});

const applyPromo = catchAsync(async (req, res) => {
  const parsedBody = applyPromoSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const discountInfo = await promoService.applyPromo(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Promo code applied successfully',
    data: discountInfo
  });
});

export const promoController = {
  createPromo,
  getPromos,
  updatePromo,
  deletePromo,
  applyPromo
};
