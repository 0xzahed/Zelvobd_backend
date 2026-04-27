import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { youtubeVideoService } from './youtubeVideo.service.js';
import { createYoutubeVideoSchema, updateYoutubeVideoSchema } from './youtubeVideo.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getYoutubeVideoIdFromParams = (req: Request): string => {
  const youtubeVideoId = req.params.id;

  if (typeof youtubeVideoId !== 'string' || youtubeVideoId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid YouTube video id is required');
  }

  return youtubeVideoId;
};

const createYoutubeVideo = catchAsync(async (req, res) => {
  const parsedBody = createYoutubeVideoSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const youtubeVideo = await youtubeVideoService.createYoutubeVideo(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'YouTube video added successfully',
    data: youtubeVideo
  });
});

const getYoutubeVideoList = catchAsync(async (req, res) => {
  const youtubeVideos = await youtubeVideoService.getYoutubeVideoList();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'YouTube videos fetched successfully',
    data: youtubeVideos
  });
});

const updateYoutubeVideo = catchAsync(async (req, res) => {
  const parsedBody = updateYoutubeVideoSchema.safeParse(req.body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const youtubeVideo = await youtubeVideoService.updateYoutubeVideo(
    getYoutubeVideoIdFromParams(req),
    parsedBody.data
  );

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'YouTube video updated successfully',
    data: youtubeVideo
  });
});

const deleteYoutubeVideo = catchAsync(async (req, res) => {
  await youtubeVideoService.deleteYoutubeVideo(getYoutubeVideoIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'YouTube video deleted successfully',
    data: null
  });
});

export const youtubeVideoController = {
  createYoutubeVideo,
  getYoutubeVideoList,
  updateYoutubeVideo,
  deleteYoutubeVideo
};
