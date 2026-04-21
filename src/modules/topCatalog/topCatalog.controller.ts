import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { topCatalogService } from './topCatalog.service';
import {
  getTopCatalogProductsQuerySchema,
  replaceTopCatalogCategoriesSchema
} from './topCatalog.validation';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const replaceTopCatalogCategories = catchAsync(async (req, res) => {
  const parsedBody = replaceTopCatalogCategoriesSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const result = await topCatalogService.replaceTopCatalogCategories(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Top catalog categories replaced successfully',
    data: result
  });
});

const getTopCatalogProducts = catchAsync(async (req, res) => {
  const parsedQuery = getTopCatalogProductsQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await topCatalogService.getTopCatalogProducts(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Top catalog products fetched successfully',
    data: {
      categories: result.categories,
      meta: result.meta,
      products: result.data
    }
  });
});

export const topCatalogController = {
  replaceTopCatalogCategories,
  getTopCatalogProducts
};
