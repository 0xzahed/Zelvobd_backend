import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';

type AdminLoginPayload = {
  email: string;
  password: string;
};

const adminLogin = async (payload: AdminLoginPayload) => {
  const existingAdmin = await prisma.admin.findUnique({
    where: { email: payload.email },
    select: {
      id: true,
      email: true,
      password: true,
      isActive: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!existingAdmin || !existingAdmin.isActive) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const isPasswordMatched = await bcrypt.compare(payload.password, existingAdmin.password);

  if (!isPasswordMatched) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid email or password');
  }

  const tokenPayload = {
    adminId: existingAdmin.id,
    email: existingAdmin.email
  };

  const accessToken = jwt.sign(tokenPayload, env.jwtAccessSecret, {
    expiresIn: env.jwtAccessExpiresIn
  } as SignOptions);

  return {
    accessToken,
    admin: {
      id: existingAdmin.id,
      email: existingAdmin.email,
      createdAt: existingAdmin.createdAt,
      updatedAt: existingAdmin.updatedAt
    }
  };
};

export const authService = {
  adminLogin
};
