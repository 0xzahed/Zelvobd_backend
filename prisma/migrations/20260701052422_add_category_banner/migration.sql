-- CreateTable
CREATE TABLE "category_banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT,
    "url" TEXT,
    "categoryId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "category_banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "category_banners_categoryId_idx" ON "category_banners"("categoryId");

-- AddForeignKey
ALTER TABLE "category_banners" ADD CONSTRAINT "category_banners_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
