import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';
import { removeLocalFile } from '../../utils/file';
import { resolveStoredRelativePath } from '../../utils/paths';

type CreateBannerPayload = {
  title: string;
  url: string;
  imageUrl: string;
  imagePath: string;
};

type UpdateBannerPayload = {
  title?: string;
  url?: string;
  imageUrl?: string;
  imagePath?: string;
};

const bannerSelect = {
  id: true,
  title: true,
  url: true,
  imageUrl: true,
  createdAt: true,
  updatedAt: true
} as const;

const createBanner = async (payload: CreateBannerPayload) => {
  return prisma.banner.create({
    data: payload,
    select: bannerSelect
  });
};

const getAllBanners = async () => {
  return prisma.banner.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: bannerSelect
  });
};

const getSingleBanner = async (id: string) => {
  const banner = await prisma.banner.findUnique({
    where: { id },
    select: bannerSelect
  });

  if (!banner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  return banner;
};

const updateBanner = async (id: string, payload: UpdateBannerPayload) => {
  const existingBanner = await prisma.banner.findUnique({
    where: { id }
  });

  if (!existingBanner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  const updatedBanner = await prisma.banner.update({
    where: { id },
    data: payload,
    select: bannerSelect
  });

  if (payload.imagePath && payload.imagePath !== existingBanner.imagePath) {
    await removeLocalFile(resolveStoredRelativePath(existingBanner.imagePath));
  }

  return updatedBanner;
};

const deleteBanner = async (id: string) => {
  const existingBanner = await prisma.banner.findUnique({
    where: { id },
    select: {
      id: true,
      imagePath: true
    }
  });

  if (!existingBanner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Banner not found');
  }

  await prisma.banner.delete({
    where: { id }
  });

  await removeLocalFile(resolveStoredRelativePath(existingBanner.imagePath));
};

export const bannerService = {
  createBanner,
  getAllBanners,
  getSingleBanner,
  updateBanner,
  deleteBanner
};
