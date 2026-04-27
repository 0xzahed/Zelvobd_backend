import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { bannerService } from './banner.service.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { removeLocalFile } from '../../utils/file.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { createBannerSchema, updateBannerSchema } from './banner.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getBannerIdFromParams = (req: Request): string => {
  const bannerId = req.params.id;

  if (typeof bannerId !== 'string' || bannerId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid banner id is required');
  }

  return bannerId;
};

const getCategoryIdFromParams = (req: Request): string => {
  const categoryId = req.params.categoryId;

  if (typeof categoryId !== 'string' || categoryId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid category id is required');
  }

  return categoryId;
};

const createBanner = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = createBannerSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Image is required');
    }

    const banner = await bannerService.createBanner({
      title: parsedBody.data.title,
      url: parsedBody.data.url,
      categoryId: parsedBody.data.categoryId,
      inHomePage: parsedBody.data.inHomePage,
      imageUrl: `/upload/banners/${uploadedFile.filename}`,
      imagePath: `upload/banners/${uploadedFile.filename}`
    });

    sendResponse(req, res, {
      statusCode: StatusCodes.CREATED,
      message: 'Banner created successfully',
      data: banner
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

const getAllBanners = catchAsync(async (req, res) => {
  const banners = await bannerService.getAllBanners();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Banners fetched successfully',
    data: banners
  });
});

const getBannersByCategoryId = catchAsync(async (req, res) => {
  const banners = await bannerService.getBannersByCategoryId(getCategoryIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Banners fetched successfully',
    data: banners
  });
});

const getHomePageBanners = catchAsync(async (req, res) => {
  const banners = await bannerService.getHomePageBanners();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Homepage banners fetched successfully',
    data: banners
  });
});

const getSingleBanner = catchAsync(async (req, res) => {
  const banner = await bannerService.getSingleBanner(getBannerIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Banner fetched successfully',
    data: banner
  });
});

const updateBanner = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = updateBannerSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile && Object.keys(parsedBody.data).length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'At least one field (title, url, categoryId, inHomePage, or image) is required for update'
      );
    }

    const payload: {
      title?: string;
      url?: string;
      categoryId?: string;
      inHomePage?: boolean;
      imageUrl?: string;
      imagePath?: string;
    } = {
      ...parsedBody.data
    };

    if (uploadedFile) {
      payload.imageUrl = `/upload/banners/${uploadedFile.filename}`;
      payload.imagePath = `upload/banners/${uploadedFile.filename}`;
    }

    const banner = await bannerService.updateBanner(getBannerIdFromParams(req), payload);

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Banner updated successfully',
      data: banner
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

const deleteBanner = catchAsync(async (req, res) => {
  await bannerService.deleteBanner(getBannerIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Banner deleted successfully',
    data: null
  });
});

export const bannerController = {
  createBanner,
  getAllBanners,
  getBannersByCategoryId,
  getHomePageBanners,
  getSingleBanner,
  updateBanner,
  deleteBanner
};
