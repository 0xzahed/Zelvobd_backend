import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';

type CreateYoutubeVideoPayload = {
  title: string;
  url: string;
  imageUrl: string;
  imagePath: string;
};

type UpdateYoutubeVideoPayload = {
  title?: string;
  url?: string;
  imageUrl?: string;
  imagePath?: string;
};

const youtubeVideoSelect = {
  id: true,
  title: true,
  url: true,
  imageUrl: true,
  imagePath: true,
  createdAt: true,
  updatedAt: true
} as const;

const createYoutubeVideo = async (payload: CreateYoutubeVideoPayload) => {
  return prisma.youtubeVideo.create({
    data: payload,
    select: youtubeVideoSelect
  });
};

const getYoutubeVideoList = async () => {
  return prisma.youtubeVideo.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    select: youtubeVideoSelect
  });
};

const updateYoutubeVideo = async (id: string, payload: UpdateYoutubeVideoPayload) => {
  const existingYoutubeVideo = await prisma.youtubeVideo.findUnique({
    where: { id },
    select: {
      id: true,
      imagePath: true
    }
  });

  if (!existingYoutubeVideo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'YouTube video not found');
  }

  const updatedVideo = await prisma.youtubeVideo.update({
    where: { id },
    data: payload,
    select: youtubeVideoSelect
  });

  return { updatedVideo, oldImagePath: payload.imagePath ? existingYoutubeVideo.imagePath : null };
};

const deleteYoutubeVideo = async (id: string) => {
  const existingYoutubeVideo = await prisma.youtubeVideo.findUnique({
    where: { id },
    select: {
      id: true,
      imagePath: true
    }
  });

  if (!existingYoutubeVideo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'YouTube video not found');
  }

  await prisma.youtubeVideo.delete({
    where: { id }
  });

  return existingYoutubeVideo.imagePath;
};

export const youtubeVideoService = {
  createYoutubeVideo,
  getYoutubeVideoList,
  updateYoutubeVideo,
  deleteYoutubeVideo
};
