import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError';
import { removeLocalFile } from '../../utils/file';
import { categoryService } from './category.service';
import {
  createCategorySchema,
  getCategoryListQuerySchema,
  updateCategorySchema
} from './category.validation';

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

const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  const uploadedFile = req.file;

  try {
    const parsedBody = createCategorySchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
    }

    if (!uploadedFile) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Image is required');
    }

    const category = await categoryService.createCategory({
      title: parsedBody.data.title,
      imageUrl: `/upload/${uploadedFile.filename}`,
      imagePath: `upload/${uploadedFile.filename}`
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    if (uploadedFile) {
      await removeLocalFile(uploadedFile.path);
    }

    next(error);
  }
};

const getCategoryList = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedQuery = getCategoryListQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedQuery.error));
    }

    const result = await categoryService.getCategoryList(parsedQuery.data);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Categories fetched successfully',
      meta: result.meta,
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};

const getSingleCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await categoryService.getSingleCategory(getCategoryIdFromParams(req));

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Category fetched successfully',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  const uploadedFile = req.file;

  try {
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
      payload.imageUrl = `/upload/${uploadedFile.filename}`;
      payload.imagePath = `upload/${uploadedFile.filename}`;
    }

    const category = await categoryService.updateCategory(getCategoryIdFromParams(req), payload);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    if (uploadedFile) {
      await removeLocalFile(uploadedFile.path);
    }

    next(error);
  }
};

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await categoryService.deleteCategory(getCategoryIdFromParams(req));

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

export const categoryController = {
  createCategory,
  getCategoryList,
  getSingleCategory,
  updateCategory,
  deleteCategory
};
