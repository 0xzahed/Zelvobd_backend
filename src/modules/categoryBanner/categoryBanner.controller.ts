import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { categoryBannerService } from './categoryBanner.service.js';
import { createCategoryBannerSchema, updateCategoryBannerSchema } from './categoryBanner.validation.js';

const getCategoryBanners = catchAsync(async (req: Request, res: Response) => {
  const categoryId = req.query.categoryId as string | undefined;
  const result = await categoryBannerService.getCategoryBanners(categoryId);
  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Category Banners retrieved successfully',
    data: result
  });
});

const createCategoryBanner = catchAsync(async (req: Request, res: Response) => {
  const payload = createCategoryBannerSchema.parse(req.body);
  const result = await categoryBannerService.createCategoryBanner(payload, req.file);
  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Category Banner created successfully',
    data: result
  });
});

const updateCategoryBanner = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const payload = updateCategoryBannerSchema.parse(req.body);
  const result = await categoryBannerService.updateCategoryBanner(id, payload, req.file);
  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Category Banner updated successfully',
    data: result
  });
});

const deleteCategoryBanner = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  await categoryBannerService.deleteCategoryBanner(id);
  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Category Banner deleted successfully',
    data: null
  });
});

export const categoryBannerController = {
  getCategoryBanners,
  createCategoryBanner,
  updateCategoryBanner,
  deleteCategoryBanner
};
