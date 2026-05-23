/*
  Warnings:

  - You are about to drop the column `status` on the `products` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slugId]` on the table `products` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "PromoDiscountType" AS ENUM ('AMOUNT', 'PERCENT');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PROCESSING', 'HOLD', 'PICKUP', 'DELIVERED', 'CUSTOMER_CANCELLED', 'CANCELLED', 'TRASH');

-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "subTitle" TEXT;

-- AlterTable
ALTER TABLE "products" DROP COLUMN "status",
ADD COLUMN     "isTrending" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "slugId" SERIAL NOT NULL;

-- DropEnum
DROP TYPE "ProductStatus";

-- CreateTable
CREATE TABLE "trending_campaigns" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'GLOBAL',
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_campaign_categories" (
    "id" TEXT NOT NULL,
    "trendingCampaignId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_campaign_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_campaign_sub_categories" (
    "id" TEXT NOT NULL,
    "trendingCampaignId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_campaign_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_campaign_products" (
    "id" TEXT NOT NULL,
    "trendingCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_campaign_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trending_campaign_excluded_products" (
    "id" TEXT NOT NULL,
    "trendingCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trending_campaign_excluded_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "promo_codes" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "discountType" "PromoDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "minOrderValue" DECIMAL(10,2),
    "maxDiscount" DECIMAL(10,2),
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "union" TEXT,
    "orderNotes" TEXT,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "shippingCharge" DECIMAL(10,2) NOT NULL,
    "discountAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(10,2) NOT NULL,
    "promoCode" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productImage" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "color" TEXT,
    "size" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "trending_campaigns_singletonKey_key" ON "trending_campaigns"("singletonKey");

-- CreateIndex
CREATE INDEX "trending_campaign_categories_trendingCampaignId_idx" ON "trending_campaign_categories"("trendingCampaignId");

-- CreateIndex
CREATE INDEX "trending_campaign_categories_categoryId_idx" ON "trending_campaign_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "trending_campaign_categories_trendingCampaignId_categoryId_key" ON "trending_campaign_categories"("trendingCampaignId", "categoryId");

-- CreateIndex
CREATE INDEX "trending_campaign_sub_categories_trendingCampaignId_idx" ON "trending_campaign_sub_categories"("trendingCampaignId");

-- CreateIndex
CREATE INDEX "trending_campaign_sub_categories_subCategoryId_idx" ON "trending_campaign_sub_categories"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "trending_campaign_sub_categories_trendingCampaignId_subCate_key" ON "trending_campaign_sub_categories"("trendingCampaignId", "subCategoryId");

-- CreateIndex
CREATE INDEX "trending_campaign_products_trendingCampaignId_idx" ON "trending_campaign_products"("trendingCampaignId");

-- CreateIndex
CREATE INDEX "trending_campaign_products_productId_idx" ON "trending_campaign_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "trending_campaign_products_trendingCampaignId_productId_key" ON "trending_campaign_products"("trendingCampaignId", "productId");

-- CreateIndex
CREATE INDEX "trending_campaign_excluded_products_trendingCampaignId_idx" ON "trending_campaign_excluded_products"("trendingCampaignId");

-- CreateIndex
CREATE INDEX "trending_campaign_excluded_products_productId_idx" ON "trending_campaign_excluded_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "trending_campaign_excluded_products_trendingCampaignId_prod_key" ON "trending_campaign_excluded_products"("trendingCampaignId", "productId");

-- CreateIndex
CREATE UNIQUE INDEX "promo_codes_code_key" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_code_idx" ON "promo_codes"("code");

-- CreateIndex
CREATE INDEX "promo_codes_isActive_idx" ON "promo_codes"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "orders_code_key" ON "orders"("code");

-- CreateIndex
CREATE INDEX "orders_code_idx" ON "orders"("code");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_customerPhone_idx" ON "orders"("customerPhone");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE INDEX "order_items_productId_idx" ON "order_items"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "products_slugId_key" ON "products"("slugId");

-- CreateIndex
CREATE INDEX "products_isTrending_idx" ON "products"("isTrending");

-- AddForeignKey
ALTER TABLE "trending_campaign_categories" ADD CONSTRAINT "trending_campaign_categories_trendingCampaignId_fkey" FOREIGN KEY ("trendingCampaignId") REFERENCES "trending_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_categories" ADD CONSTRAINT "trending_campaign_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_sub_categories" ADD CONSTRAINT "trending_campaign_sub_categories_trendingCampaignId_fkey" FOREIGN KEY ("trendingCampaignId") REFERENCES "trending_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_sub_categories" ADD CONSTRAINT "trending_campaign_sub_categories_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_products" ADD CONSTRAINT "trending_campaign_products_trendingCampaignId_fkey" FOREIGN KEY ("trendingCampaignId") REFERENCES "trending_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_products" ADD CONSTRAINT "trending_campaign_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_excluded_products" ADD CONSTRAINT "trending_campaign_excluded_products_trendingCampaignId_fkey" FOREIGN KEY ("trendingCampaignId") REFERENCES "trending_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trending_campaign_excluded_products" ADD CONSTRAINT "trending_campaign_excluded_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
