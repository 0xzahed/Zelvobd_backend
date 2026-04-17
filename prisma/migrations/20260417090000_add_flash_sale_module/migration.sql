-- CreateEnum
CREATE TYPE "public"."FlashSaleDiscountType" AS ENUM ('PERCENT', 'TAKA');

-- CreateTable
CREATE TABLE "public"."flash_sale_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "discountType" "public"."FlashSaleDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sale_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."flash_sale_products" (
    "id" TEXT NOT NULL,
    "flashSaleCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sale_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "flash_sale_campaigns_startAt_idx" ON "public"."flash_sale_campaigns"("startAt");

-- CreateIndex
CREATE INDEX "flash_sale_campaigns_endAt_idx" ON "public"."flash_sale_campaigns"("endAt");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_products_flashSaleCampaignId_productId_key" ON "public"."flash_sale_products"("flashSaleCampaignId", "productId");

-- CreateIndex
CREATE INDEX "flash_sale_products_flashSaleCampaignId_idx" ON "public"."flash_sale_products"("flashSaleCampaignId");

-- CreateIndex
CREATE INDEX "flash_sale_products_productId_idx" ON "public"."flash_sale_products"("productId");

-- AddForeignKey
ALTER TABLE "public"."flash_sale_products" ADD CONSTRAINT "flash_sale_products_flashSaleCampaignId_fkey" FOREIGN KEY ("flashSaleCampaignId") REFERENCES "public"."flash_sale_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."flash_sale_products" ADD CONSTRAINT "flash_sale_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
