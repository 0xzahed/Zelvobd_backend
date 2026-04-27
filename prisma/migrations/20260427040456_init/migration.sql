-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('PENDING', 'PROCESSING', 'HOLD', 'PICKUP', 'DELIVERED', 'PARTIAL', 'REJECT', 'CANCEL', 'NOT_COMPLETED', 'TRASH');

-- CreateEnum
CREATE TYPE "FlashSaleDiscountType" AS ENUM ('PERCENT', 'TAKA');

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_refresh_tokens" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "top_catalog_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_catalog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sub_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descriptionDelta" JSONB NOT NULL,
    "descriptionHtml" TEXT NOT NULL,
    "extraDescriptionDelta" JSONB,
    "extraDescriptionHtml" TEXT,
    "weight" TEXT NOT NULL,
    "material" TEXT NOT NULL,
    "stock" BOOLEAN NOT NULL DEFAULT true,
    "availability" BOOLEAN NOT NULL DEFAULT true,
    "isFreeDelivery" BOOLEAN NOT NULL DEFAULT false,
    "status" "ProductStatus" NOT NULL DEFAULT 'PENDING',
    "videoUrl" TEXT,
    "videoPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_delivery_campaigns" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'GLOBAL',
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_delivery_campaign_categories" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_delivery_campaign_sub_categories" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_delivery_campaign_products" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "free_delivery_campaign_excluded_products" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_excluded_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "actualPrice" DECIMAL(10,2) NOT NULL,
    "discountedPrice" DECIMAL(10,2) NOT NULL,
    "color" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "barcodeUrl" TEXT,
    "barcodePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "categoryId" TEXT,
    "inHomePage" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "youtube_videos" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "youtube_videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_campaigns" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "discountType" "FlashSaleDiscountType" NOT NULL,
    "discountValue" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sale_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flash_sale_products" (
    "id" TEXT NOT NULL,
    "flashSaleCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flash_sale_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "admin_refresh_tokens_sessionId_key" ON "admin_refresh_tokens"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "admin_refresh_tokens_tokenHash_key" ON "admin_refresh_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_adminId_idx" ON "admin_refresh_tokens"("adminId");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_expiresAt_idx" ON "admin_refresh_tokens"("expiresAt");

-- CreateIndex
CREATE INDEX "admin_refresh_tokens_revokedAt_idx" ON "admin_refresh_tokens"("revokedAt");

-- CreateIndex
CREATE UNIQUE INDEX "categories_title_key" ON "categories"("title");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "top_catalog_categories_categoryId_key" ON "top_catalog_categories"("categoryId");

-- CreateIndex
CREATE INDEX "top_catalog_categories_createdAt_idx" ON "top_catalog_categories"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_slug_key" ON "sub_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_categoryId_title_key" ON "sub_categories"("categoryId", "title");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_categoryId_idx" ON "products"("categoryId");

-- CreateIndex
CREATE INDEX "products_subCategoryId_idx" ON "products"("subCategoryId");

-- CreateIndex
CREATE INDEX "products_isFreeDelivery_idx" ON "products"("isFreeDelivery");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaigns_singletonKey_key" ON "free_delivery_campaigns"("singletonKey");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_categories_freeDeliveryCampaignId_idx" ON "free_delivery_campaign_categories"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_categories_categoryId_idx" ON "free_delivery_campaign_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_categories_freeDeliveryCampaignId_ca_key" ON "free_delivery_campaign_categories"("freeDeliveryCampaignId", "categoryId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_sub_categories_freeDeliveryCampaignI_idx" ON "free_delivery_campaign_sub_categories"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_sub_categories_subCategoryId_idx" ON "free_delivery_campaign_sub_categories"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_sub_categories_freeDeliveryCampaignI_key" ON "free_delivery_campaign_sub_categories"("freeDeliveryCampaignId", "subCategoryId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_products_freeDeliveryCampaignId_idx" ON "free_delivery_campaign_products"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_products_productId_idx" ON "free_delivery_campaign_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_products_freeDeliveryCampaignId_prod_key" ON "free_delivery_campaign_products"("freeDeliveryCampaignId", "productId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_excluded_products_freeDeliveryCampai_idx" ON "free_delivery_campaign_excluded_products"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_excluded_products_productId_idx" ON "free_delivery_campaign_excluded_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_excluded_products_freeDeliveryCampai_key" ON "free_delivery_campaign_excluded_products"("freeDeliveryCampaignId", "productId");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "banners_categoryId_idx" ON "banners"("categoryId");

-- CreateIndex
CREATE INDEX "banners_inHomePage_idx" ON "banners"("inHomePage");

-- CreateIndex
CREATE INDEX "flash_sale_campaigns_startAt_idx" ON "flash_sale_campaigns"("startAt");

-- CreateIndex
CREATE INDEX "flash_sale_campaigns_endAt_idx" ON "flash_sale_campaigns"("endAt");

-- CreateIndex
CREATE INDEX "flash_sale_products_flashSaleCampaignId_idx" ON "flash_sale_products"("flashSaleCampaignId");

-- CreateIndex
CREATE INDEX "flash_sale_products_productId_idx" ON "flash_sale_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "flash_sale_products_flashSaleCampaignId_productId_key" ON "flash_sale_products"("flashSaleCampaignId", "productId");

-- AddForeignKey
ALTER TABLE "admin_refresh_tokens" ADD CONSTRAINT "admin_refresh_tokens_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "admins"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "top_catalog_categories" ADD CONSTRAINT "top_catalog_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sub_categories" ADD CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_categories" ADD CONSTRAINT "free_delivery_campaign_categories_freeDeliveryCampaignId_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_categories" ADD CONSTRAINT "free_delivery_campaign_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_sub_categories" ADD CONSTRAINT "free_delivery_campaign_sub_categories_freeDeliveryCampaign_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_sub_categories" ADD CONSTRAINT "free_delivery_campaign_sub_categories_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_products" ADD CONSTRAINT "free_delivery_campaign_products_freeDeliveryCampaignId_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_products" ADD CONSTRAINT "free_delivery_campaign_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_excluded_products" ADD CONSTRAINT "free_delivery_campaign_excluded_products_freeDeliveryCampa_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "free_delivery_campaign_excluded_products" ADD CONSTRAINT "free_delivery_campaign_excluded_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "banners" ADD CONSTRAINT "banners_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_flashSaleCampaignId_fkey" FOREIGN KEY ("flashSaleCampaignId") REFERENCES "flash_sale_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flash_sale_products" ADD CONSTRAINT "flash_sale_products_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
