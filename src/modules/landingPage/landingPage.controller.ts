import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { LandingPageService } from './landingPage.service.js';

const createLandingPage = catchAsync(async (req: Request, res: Response) => {
  const result = await LandingPageService.createLandingPage(req.body);

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Landing Page created successfully',
    data: result,
  });
});

const getAllLandingPages = catchAsync(async (req: Request, res: Response) => {
  const result = await LandingPageService.getAllLandingPages();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Landing Pages retrieved successfully',
    data: result,
  });
});

const getLandingPageById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageService.getLandingPageById(id as string);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Landing Page retrieved successfully',
    data: result,
  });
});

const getLandingPageBySlug = catchAsync(async (req: Request, res: Response) => {
  const { slug } = req.params;
  const result = await LandingPageService.getLandingPageBySlug(slug as string);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Landing Page retrieved successfully',
    data: result,
  });
});

const updateLandingPage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageService.updateLandingPage(id as string, req.body);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Landing Page updated successfully',
    data: result,
  });
});

const deleteLandingPage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await LandingPageService.deleteLandingPage(id as string);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
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
