import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../core/utils/catchAsync.js';
import sendResponse from '../../core/utils/sendResponse.js';
import { LandingPageService } from './landingPage.service.js';

const createLandingPage = catchAsync(async (req: Request, res: Response) => {
  const result = await LandingPageService.createLandingPage(req.body);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: 'Landing Page created successfully',
    data: result,
  });
});

const getAllLandingPages = catchAsync(async (req: Request, res: Response) => {
  const result = await LandingPageService.getAllLandingPages();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Landing Pages retrieved successfully',
    data: result,
  });
});

const getLandingPageById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageService.getLandingPageById(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Landing Page retrieved successfully',
    data: result,
  });
});

const getLandingPageBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await LandingPageService.getLandingPageBySlug(slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Landing Page retrieved successfully',
    data: result,
  });
});

const updateLandingPage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageService.updateLandingPage(id, req.body);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Landing Page updated successfully',
    data: result,
  });
});

const deleteLandingPage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageService.deleteLandingPage(id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Landing Page deleted successfully',
    data: result,
  });
});

export const LandingPageController = {
  createLandingPage,
  getAllLandingPages,
  getLandingPageById,
  getLandingPageBySlug,
  updateLandingPage,
  deleteLandingPage,
};
