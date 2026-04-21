import { StatusCodes } from 'http-status-codes';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';

type CreateYoutubeVideoPayload = {
  url: string;
};

type UpdateYoutubeVideoPayload = {
  url: string;
};

const youtubeVideoSelect = {
  id: true,
  url: true,
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
      id: true
    }
  });

  if (!existingYoutubeVideo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'YouTube video not found');
  }

  return prisma.youtubeVideo.update({
    where: { id },
    data: payload,
    select: youtubeVideoSelect
  });
};

const deleteYoutubeVideo = async (id: string) => {
  const existingYoutubeVideo = await prisma.youtubeVideo.findUnique({
    where: { id },
    select: {
      id: true
    }
  });

  if (!existingYoutubeVideo) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'YouTube video not found');
  }

  await prisma.youtubeVideo.delete({
    where: { id }
  });
};

export const youtubeVideoService = {
  createYoutubeVideo,
  getYoutubeVideoList,
  updateYoutubeVideo,
  deleteYoutubeVideo
};
