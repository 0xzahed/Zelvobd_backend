import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { removeLocalFile } from '../../utils/file.js';
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

const createYoutubeVideo = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = createYoutubeVideoSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Thumbnail image is required');
    }

    const youtubeVideo = await youtubeVideoService.createYoutubeVideo({
      title: parsedBody.data.title,
      url: parsedBody.data.url,
      imageUrl: `/upload/youtubeVideos/${uploadedFile.filename}`,
      imagePath: `upload/youtubeVideos/${uploadedFile.filename}`
    });

    sendResponse(req, res, {
      statusCode: StatusCodes.CREATED,
      message: 'YouTube video added successfully',
      data: youtubeVideo
    });
  },
  {
    onError: async (req) => {
      const uploadedFile = req.file;

      if (uploadedFile) {
        await removeLocalFile(uploadedFile.path);
      }
    }
  }
);

const getYoutubeVideoList = catchAsync(async (req, res) => {
  const youtubeVideos = await youtubeVideoService.getYoutubeVideoList();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'YouTube videos fetched successfully',
    data: youtubeVideos
  });
});

const updateYoutubeVideo = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = updateYoutubeVideoSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile && Object.keys(parsedBody.data).length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'At least one field (title, url, or image) is required for update'
      );
    }

    const payload: {
      title?: string;
      url?: string;
      imageUrl?: string;
      imagePath?: string;
    } = {
      ...parsedBody.data
    };

    if (uploadedFile) {
      payload.imageUrl = `/upload/youtubeVideos/${uploadedFile.filename}`;
      payload.imagePath = `upload/youtubeVideos/${uploadedFile.filename}`;
    }

    const { updatedVideo, oldImagePath } = await youtubeVideoService.updateYoutubeVideo(
      getYoutubeVideoIdFromParams(req),
      payload
    );

    if (oldImagePath) {
      await removeLocalFile(oldImagePath);
    }

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'YouTube video updated successfully',
      data: updatedVideo
    });
  },
  {
    onError: async (req) => {
      const uploadedFile = req.file;

      if (uploadedFile) {
        await removeLocalFile(uploadedFile.path);
      }
    }
  }
);

const deleteYoutubeVideo = catchAsync(async (req, res) => {
  const oldImagePath = await youtubeVideoService.deleteYoutubeVideo(getYoutubeVideoIdFromParams(req));

  if (oldImagePath) {
    await removeLocalFile(oldImagePath);
  }

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
