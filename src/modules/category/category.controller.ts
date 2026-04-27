import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { removeLocalFile } from '../../utils/file.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { categoryService } from './category.service.js';
import {
  createCategorySchema,
  getCategoryListQuerySchema,
  updateCategorySchema
} from './category.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getCategoryIdFromParams = (req: Request): string => {
  const categoryId = req.params.id;

  if (typeof categoryId !== 'string' || categoryId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid category id is required');
  }

  return categoryId;
};

const createCategory = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = createCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Image is required');
    }

    const category = await categoryService.createCategory({
      title: parsedBody.data.title,
      imageUrl: `/upload/categories/${uploadedFile.filename}`,
      imagePath: `upload/categories/${uploadedFile.filename}`
    });

    sendResponse(req, res, {
      statusCode: StatusCodes.CREATED,
      message: 'Category created successfully',
      data: category
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

const getCategoryList = catchAsync(async (req, res) => {
  const parsedQuery = getCategoryListQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await categoryService.getCategoryList(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Categories fetched successfully',
    data: {
      meta: result.meta,
      categories: result.data
    }
  });
});

const getSingleCategory = catchAsync(async (req, res) => {
  const category = await categoryService.getSingleCategory(getCategoryIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Category fetched successfully',
    data: category
  });
});

const updateCategory = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = updateCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile && Object.keys(parsedBody.data).length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'At least one field (title or image) is required for update'
      );
    }

    const payload: {
      title?: string;
      imageUrl?: string;
      imagePath?: string;
    } = {
      ...parsedBody.data
    };

    if (uploadedFile) {
      payload.imageUrl = `/upload/categories/${uploadedFile.filename}`;
      payload.imagePath = `upload/categories/${uploadedFile.filename}`;
    }

    const category = await categoryService.updateCategory(getCategoryIdFromParams(req), payload);

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Category updated successfully',
      data: category
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

const deleteCategory = catchAsync(async (req, res) => {
  await categoryService.deleteCategory(getCategoryIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Category deleted successfully',
    data: null
  });
});

export const categoryController = {
  createCategory,
  getCategoryList,
  getSingleCategory,
  updateCategory,
  deleteCategory
};
