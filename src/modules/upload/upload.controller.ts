import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { ApiError } from '../../core/errors/ApiError.js';

const uploadRichTextImage = catchAsync(async (req: Request, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Image file is required');
  }

  const imageUrl = `/upload/richText/${uploadedFile.filename}`;

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Image uploaded successfully',
    data: {
      url: imageUrl
    }
  });
});

const uploadImage = catchAsync(async (req: Request, res) => {
  const uploadedFile = req.file;

  if (!uploadedFile) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Image file is required');
  }

  const imageUrl = `/upload/admin/${uploadedFile.filename}`;

  sendResponse(req, res, {
    statusCode: StatusCodes.CREATED,
    message: 'Image uploaded successfully',
    data: {
      url: imageUrl
    }
  });
});

export const uploadController = {
  uploadRichTextImage,
  uploadImage
};
