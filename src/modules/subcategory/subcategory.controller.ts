import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { removeLocalFile } from '../../utils/file.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { subCategoryService } from './subcategory.service.js';
import {
  createSubCategorySchema,
  getSubCategoryListQuerySchema,
  updateSubCategorySchema
} from './subcategory.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getSubCategoryIdFromParams = (req: Request): string => {
  const subCategoryId = req.params.id;

  if (typeof subCategoryId !== 'string' || subCategoryId.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Valid subcategory id is required');
  }

  return subCategoryId;
};

const createSubCategory = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = createSubCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Image is required');
    }

    const subCategory = await subCategoryService.createSubCategory({
      categoryId: parsedBody.data.categoryId,
      title: parsedBody.data.title,
      imageUrl: `/upload/subCategories/${uploadedFile.filename}`,
      imagePath: `upload/subCategories/${uploadedFile.filename}`
    });

    sendResponse(req, res, {
      statusCode: StatusCodes.CREATED,
      message: 'Subcategory created successfully',
      data: subCategory
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

const getSubCategoryList = catchAsync(async (req, res) => {
  const parsedQuery = getSubCategoryListQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
  }

  const result = await subCategoryService.getSubCategoryList(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Subcategories fetched successfully',
    data: {
      meta: result.meta,
      subCategories: result.data
    }
  });
});

const getSingleSubCategory = catchAsync(async (req, res) => {
  const subCategory = await subCategoryService.getSingleSubCategory(getSubCategoryIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Subcategory fetched successfully',
    data: subCategory
  });
});

const updateSubCategory = catchAsync(
  async (req, res) => {
    const uploadedFile = req.file;
    const parsedBody = updateSubCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile && Object.keys(parsedBody.data).length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'At least one field (title, category, or image) is required for update'
      );
    }

    const payload: {
      categoryId?: string;
      title?: string;
      imageUrl?: string;
      imagePath?: string;
    } = {
      ...parsedBody.data
    };

    if (uploadedFile) {
      payload.imageUrl = `/upload/subCategories/${uploadedFile.filename}`;
      payload.imagePath = `upload/subCategories/${uploadedFile.filename}`;
    }

    const subCategory = await subCategoryService.updateSubCategory(
      getSubCategoryIdFromParams(req),
      payload
    );

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Subcategory updated successfully',
      data: subCategory
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

const deleteSubCategory = catchAsync(async (req, res) => {
  await subCategoryService.deleteSubCategory(getSubCategoryIdFromParams(req));

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Subcategory deleted successfully',
    data: null
  });
});

export const subCategoryController = {
  createSubCategory,
  getSubCategoryList,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory
};
