// import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { authService } from './auth.service';
import { adminLoginSchema } from './auth.validation';

const adminLogin = catchAsync(async (req, res) => {
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
});

export const authController = {
  adminLogin
};
