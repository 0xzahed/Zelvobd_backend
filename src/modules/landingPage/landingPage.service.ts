import { PrismaClient, LandingPage } from '@prisma/client';
import { ApiError } from '../../core/errors/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { prisma } from '../../lib/prisma.js';

const createLandingPage = async (payload: Partial<LandingPage>): Promise<LandingPage> => {
  const count = await prisma.landingPage.count();
  if (count >= 5) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Maximum limit of 5 landing pages reached.');
  }

  // Ensure slug uniqueness
  const existing = await prisma.landingPage.findUnique({
    where: { slug: payload.slug },
  });
  if (existing) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'A landing page with this slug already exists.');
  }

  const result = await prisma.landingPage.create({
    data: payload as any,
  });
  return result;
};

const getAllLandingPages = async (): Promise<LandingPage[]> => {
  const result = await prisma.landingPage.findMany({
    orderBy: { createdAt: 'desc' },
  });
  return result;
};

const getLandingPageById = async (id: string): Promise<LandingPage | null> => {
  const result = await prisma.landingPage.findUnique({
    where: { id },
  });
  return result;
};

const getLandingPageBySlug = async (slug: string): Promise<LandingPage | null> => {
  const result = await prisma.landingPage.findUnique({
    where: { slug },
  });
  return result;
};

const updateLandingPage = async (
  id: string,
  payload: Partial<LandingPage>
): Promise<LandingPage> => {
  if (payload.slug) {
    const existing = await prisma.landingPage.findFirst({
      where: {
        slug: payload.slug,
        id: { not: id },
      },
    });
    if (existing) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Slug already in use by another landing page.');
    }
  }

  const result = await prisma.landingPage.update({
    where: { id },
    data: payload as any,
  });
  return result;
};

const deleteLandingPage = async (id: string): Promise<LandingPage> => {
  const result = await prisma.landingPage.delete({
    where: { id },
  });
  return result;
};

export const LandingPageService = {
  createLandingPage,
  getAllLandingPages,
  getLandingPageById,
  getLandingPageBySlug,
  updateLandingPage,
  deleteLandingPage,
};
