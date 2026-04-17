import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env';
import { ApiError } from '../core/errors/ApiError';
import { prisma } from '../lib/prisma';

type JwtPayload = {
  adminId: string;
  email: string;
  tokenType: 'access';
};

export const requireAdminAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authorization token is required');
    }

    const accessToken = authorizationHeader.split(' ')[1];

    const decoded = jwt.verify(accessToken, env.jwtAccessSecret);

    if (
      typeof decoded === 'string' ||
      !decoded ||
      typeof decoded.adminId !== 'string' ||
      typeof decoded.email !== 'string' ||
      decoded.tokenType !== 'access'
    ) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid authorization token');
    }

    const tokenPayload = decoded as JwtPayload;

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: tokenPayload.adminId },
      select: { id: true, isActive: true }
    });

    if (!existingAdmin) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
    }

    if (!existingAdmin.isActive) {
      throw new ApiError(StatusCodes.FORBIDDEN, 'Admin account is inactive');
    }

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Authorization token expired'));
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid authorization token'));
      return;
    }

    next(error);
  }
};
