import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError';
import { removeLocalFile } from '../../utils/file';
import { sendResponse } from '../../utils/sendResponse';
import { subCategoryService } from './subcategory.service';
import {
  createSubCategorySchema,
  getSubCategoryListQuerySchema,
  updateSubCategorySchema
} from './subcategory.validation';

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

const createSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  const uploadedFile = req.file;

  try {
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
  } catch (error) {
    if (uploadedFile) {
      await removeLocalFile(uploadedFile.path);
    }

    next(error);
  }
};

const getSubCategoryList = async (req: Request, res: Response, next: NextFunction) => {
  try {
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
  } catch (error) {
    next(error);
  }
};

const getSingleSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subCategory = await subCategoryService.getSingleSubCategory(getSubCategoryIdFromParams(req));

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Subcategory fetched successfully',
      data: subCategory
    });
  } catch (error) {
    next(error);
  }
};

const updateSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  const uploadedFile = req.file;

  try {
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
  } catch (error) {
    if (uploadedFile) {
      await removeLocalFile(uploadedFile.path);
    }

    next(error);
  }
};

const deleteSubCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await subCategoryService.deleteSubCategory(getSubCategoryIdFromParams(req));

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Subcategory deleted successfully',
      data: null
    });
  } catch (error) {
    next(error);
  }
};

export const subCategoryController = {
  createSubCategory,
  getSubCategoryList,
  getSingleSubCategory,
  updateSubCategory,
  deleteSubCategory
};
