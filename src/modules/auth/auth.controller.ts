import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { sendResponse } from '../../utils/sendResponse';
import { authService } from './auth.service';
import { adminLoginSchema } from './auth.validation';

const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsedBody = adminLoginSchema.safeParse(req.body);

    if (!parsedBody.success) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        parsedBody.error.issues[0]?.message ?? 'Invalid login payload'
      );
    }

    const result = await authService.adminLogin(parsedBody.data);

    sendResponse(req, res, {
      statusCode: StatusCodes.OK,
      message: 'Admin logged in successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const authController = {
  adminLogin
};
