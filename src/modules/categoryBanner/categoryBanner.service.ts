import { StatusCodes } from 'http-status-codes';
import fs from 'node:fs';
import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';

export interface ICategoryBannerPayload {
  title: string;
  subTitle?: string;
  url?: string;
  categoryId: string;
}

export const getCategoryBanners = async (categoryId?: string) => {
  const banners = await prisma.categoryBanner.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: {
      category: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return banners;
};

export const createCategoryBanner = async (
  payload: ICategoryBannerPayload,
  file?: Express.Multer.File
) => {
  if (!file) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Image is required');
  }

  const category = await prisma.category.findUnique({
    where: { id: payload.categoryId }
  });

  if (!category) {
    fs.unlinkSync(file.path);
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
  }

  const relativeUrl = `/uploads/categoryBanners/${file.filename}`;

  const banner = await prisma.categoryBanner.create({
    data: {
      title: payload.title,
      subTitle: payload.subTitle || null,
      url: payload.url || null,
      categoryId: payload.categoryId,
      imagePath: file.path,
      imageUrl: relativeUrl
    },
    include: {
      category: true
    }
  });

  return banner;
};

export const updateCategoryBanner = async (
  id: string,
  payload: Partial<ICategoryBannerPayload>,
  file?: Express.Multer.File
) => {
  const existingBanner = await prisma.categoryBanner.findUnique({
    where: { id }
  });

  if (!existingBanner) {
    if (file) fs.unlinkSync(file.path);
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category Banner not found');
  }

  if (payload.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: payload.categoryId }
    });
    if (!category) {
      if (file) fs.unlinkSync(file.path);
      throw new ApiError(StatusCodes.NOT_FOUND, 'Category not found');
    }
  }

  const updateData: Record<string, unknown> = {
    title: payload.title,
    subTitle: payload.subTitle || null,
    url: payload.url || null,
    categoryId: payload.categoryId
  };

  if (file) {
    const relativeUrl = `/uploads/categoryBanners/${file.filename}`;
    updateData.imagePath = file.path;
    updateData.imageUrl = relativeUrl;

    if (fs.existsSync(existingBanner.imagePath)) {
      fs.unlinkSync(existingBanner.imagePath);
    }
  }

  const updatedBanner = await prisma.categoryBanner.update({
    where: { id },
    data: updateData,
    include: { category: true }
  });

  return updatedBanner;
};

export const deleteCategoryBanner = async (id: string) => {
  const banner = await prisma.categoryBanner.findUnique({
    where: { id }
  });

  if (!banner) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Category Banner not found');
  }

  if (fs.existsSync(banner.imagePath)) {
    fs.unlinkSync(banner.imagePath);
  }

  await prisma.categoryBanner.delete({
    where: { id }
  });

  return null;
};

export const categoryBannerService = {
  getCategoryBanners,
  createCategoryBanner,
  updateCategoryBanner,
  deleteCategoryBanner
};
