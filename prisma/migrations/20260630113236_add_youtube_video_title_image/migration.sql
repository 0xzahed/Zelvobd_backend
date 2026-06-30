/*
  Warnings:

  - Added the required column `imagePath` to the `youtube_videos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `imageUrl` to the `youtube_videos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `youtube_videos` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "youtube_videos" ADD COLUMN     "imagePath" TEXT NOT NULL,
ADD COLUMN     "imageUrl" TEXT NOT NULL,
ADD COLUMN     "title" TEXT NOT NULL;
