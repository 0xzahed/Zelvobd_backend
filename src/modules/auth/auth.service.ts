import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env';
import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';

type AdminLoginPayload = {
  email: string;
  password: string;
};

type AdminTokenPayload = {
  adminId: string;
  email: string;
};

type RefreshTokenPayload = AdminTokenPayload & {
  tokenType: 'refresh';
  sessionId: string;
};

type AdminAuthResult = {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  admin: {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  };
};

const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

const getTokenExpiryDate = (token: string): Date => {
  const decodedToken = jwt.decode(token);

  if (
    !decodedToken ||
    typeof decodedToken === 'string' ||
    typeof decodedToken.exp !== 'number'
  ) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'Unable to determine token expiration');
  }

  return new Date(decodedToken.exp * 1000);
};

const generateAccessToken = (payload: AdminTokenPayload): string => {
  return jwt.sign(
    {
      adminId: payload.adminId,
      email: payload.email,
      tokenType: 'access'
    },
    env.jwtAccessSecret,
    {
      expiresIn: env.jwtAccessExpiresIn
    } as SignOptions
  );
};

const generateRefreshToken = (payload: AdminTokenPayload) => {
  const sessionId = crypto.randomUUID();
  const refreshToken = jwt.sign(
    {
      adminId: payload.adminId,
      email: payload.email,
      tokenType: 'refresh',
      sessionId
    },
    env.jwtRefreshSecret,
    {
      expiresIn: env.jwtRefreshExpiresIn
    } as SignOptions
  );

  return {
    refreshToken,
    sessionId,
    expiresAt: getTokenExpiryDate(refreshToken)
  };
};

const validateRefreshToken = (refreshToken: string): RefreshTokenPayload => {
  try {
    const decodedToken = jwt.verify(refreshToken, env.jwtRefreshSecret);

    if (
      typeof decodedToken === 'string' ||
      !decodedToken ||
      typeof decodedToken.adminId !== 'string' ||
      typeof decodedToken.email !== 'string' ||
      decodedToken.tokenType !== 'refresh' ||
      typeof decodedToken.sessionId !== 'string'
    ) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    return decodedToken as RefreshTokenPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired');
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
    }

    throw error;
  }
};

const createAdminAuthResult = async (admin: {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}): Promise<AdminAuthResult> => {
  const tokenPayload: AdminTokenPayload = {
    adminId: admin.id,
    email: admin.email
  };
  const accessToken = generateAccessToken(tokenPayload);
  const accessTokenExpiresAt = getTokenExpiryDate(accessToken);
  const { refreshToken, sessionId, expiresAt } = generateRefreshToken(tokenPayload);

  await prisma.adminRefreshToken.create({
    data: {
      adminId: admin.id,
      sessionId,
      tokenHash: hashToken(refreshToken),
      expiresAt
    }
  });

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken,
    refreshTokenExpiresAt: expiresAt,
    admin: {
      id: admin.id,
      email: admin.email,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
    }
  };
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

  return createAdminAuthResult({
    id: existingAdmin.id,
    email: existingAdmin.email,
    createdAt: existingAdmin.createdAt,
    updatedAt: existingAdmin.updatedAt
  });
};

const refreshAdminToken = async (refreshToken: string): Promise<AdminAuthResult> => {
  const decodedRefreshToken = validateRefreshToken(refreshToken);
  const tokenHash = hashToken(refreshToken);

  const existingSession = await prisma.adminRefreshToken.findUnique({
    where: {
      sessionId: decodedRefreshToken.sessionId
    },
    select: {
      id: true,
      adminId: true,
      tokenHash: true,
      expiresAt: true,
      revokedAt: true,
      admin: {
        select: {
          id: true,
          email: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  if (
    !existingSession ||
    existingSession.revokedAt ||
    existingSession.adminId !== decodedRefreshToken.adminId ||
    existingSession.tokenHash !== tokenHash
  ) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid refresh token');
  }

  if (existingSession.expiresAt <= new Date()) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Refresh token expired');
  }

  if (!existingSession.admin) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Admin account not found');
  }

  if (!existingSession.admin.isActive) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Admin account is inactive');
  }

  const tokenPayload: AdminTokenPayload = {
    adminId: existingSession.admin.id,
    email: existingSession.admin.email
  };
  const accessToken = generateAccessToken(tokenPayload);
  const accessTokenExpiresAt = getTokenExpiryDate(accessToken);
  const {
    refreshToken: nextRefreshToken,
    sessionId: nextSessionId,
    expiresAt: nextRefreshTokenExpiresAt
  } = generateRefreshToken(tokenPayload);
  const now = new Date();

  await prisma.$transaction([
    prisma.adminRefreshToken.update({
      where: {
        id: existingSession.id
      },
      data: {
        revokedAt: now,
        lastUsedAt: now
      }
    }),
    prisma.adminRefreshToken.create({
      data: {
        adminId: existingSession.admin.id,
        sessionId: nextSessionId,
        tokenHash: hashToken(nextRefreshToken),
        expiresAt: nextRefreshTokenExpiresAt
      }
    })
  ]);

  return {
    accessToken,
    accessTokenExpiresAt,
    refreshToken: nextRefreshToken,
    refreshTokenExpiresAt: nextRefreshTokenExpiresAt,
    admin: {
      id: existingSession.admin.id,
      email: existingSession.admin.email,
      createdAt: existingSession.admin.createdAt,
      updatedAt: existingSession.admin.updatedAt
    }
  };
};

const logoutAdmin = async (refreshToken: string): Promise<void> => {
  const tokenHash = hashToken(refreshToken);
  const now = new Date();

  await prisma.adminRefreshToken.updateMany({
    where: {
      tokenHash,
      revokedAt: null
    },
    data: {
      revokedAt: now,
      lastUsedAt: now
    }
  });
};

export const authService = {
  adminLogin,
  refreshAdminToken,
  logoutAdmin
};
