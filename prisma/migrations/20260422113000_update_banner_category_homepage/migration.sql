-- AlterTable
ALTER TABLE "public"."banners"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "inHomePage" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "banners_categoryId_idx" ON "public"."banners"("categoryId");

-- CreateIndex
CREATE INDEX "banners_inHomePage_idx" ON "public"."banners"("inHomePage");

-- AddForeignKey
ALTER TABLE "public"."banners" ADD CONSTRAINT "banners_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
