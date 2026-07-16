import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';

type JwtPayload = {
  adminId: string;
  email: string;
  tokenType: 'access';
};

/**
 * Optional admin auth middleware.
 *
 * Unlike `requireAdminAuth`, this never throws or blocks the request. If a
 * valid admin bearer token is present, it sets `req.isAdmin = true` so
 * downstream handlers can expose admin-only data (e.g. unavailable products).
 * Otherwise `req.isAdmin` stays `false`.
 */
export const optionalAdminAuth: RequestHandler = async (req, _res, next) => {
  try {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
      (req as any).isAdmin = false;
      return next();
    }

    const accessToken = authorizationHeader.split(' ')[1];

    const decoded = jwt.verify(accessToken, env.jwtAccessSecret);

    if (
      typeof decoded === 'string' ||
      !decoded ||
      typeof (decoded as JwtPayload).adminId !== 'string' ||
      typeof (decoded as JwtPayload).email !== 'string' ||
      (decoded as JwtPayload).tokenType !== 'access'
    ) {
      (req as any).isAdmin = false;
      return next();
    }

    const tokenPayload = decoded as JwtPayload;

    const existingAdmin = await prisma.admin.findUnique({
      where: { id: tokenPayload.adminId },
      select: { id: true, isActive: true }
    });

    (req as any).isAdmin = Boolean(existingAdmin && existingAdmin.isActive);
  } catch {
    (req as any).isAdmin = false;
  }

  next();
};
