-- AlterTable
ALTER TABLE "public"."products"
ADD COLUMN "isFreeDelivery" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "public"."free_delivery_campaigns" (
    "id" TEXT NOT NULL,
    "singletonKey" TEXT NOT NULL DEFAULT 'GLOBAL',
    "title" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."free_delivery_campaign_categories" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."free_delivery_campaign_sub_categories" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "subCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_sub_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."free_delivery_campaign_products" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."free_delivery_campaign_excluded_products" (
    "id" TEXT NOT NULL,
    "freeDeliveryCampaignId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "free_delivery_campaign_excluded_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "products_isFreeDelivery_idx" ON "public"."products"("isFreeDelivery");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaigns_singletonKey_key" ON "public"."free_delivery_campaigns"("singletonKey");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_categories_freeDeliveryCampaignId_categoryId_key" ON "public"."free_delivery_campaign_categories"("freeDeliveryCampaignId", "categoryId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_categories_freeDeliveryCampaignId_idx" ON "public"."free_delivery_campaign_categories"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_categories_categoryId_idx" ON "public"."free_delivery_campaign_categories"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_sub_categories_freeDeliveryCampaignId_subCategoryId_key" ON "public"."free_delivery_campaign_sub_categories"("freeDeliveryCampaignId", "subCategoryId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_sub_categories_freeDeliveryCampaignId_idx" ON "public"."free_delivery_campaign_sub_categories"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_sub_categories_subCategoryId_idx" ON "public"."free_delivery_campaign_sub_categories"("subCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_products_freeDeliveryCampaignId_productId_key" ON "public"."free_delivery_campaign_products"("freeDeliveryCampaignId", "productId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_products_freeDeliveryCampaignId_idx" ON "public"."free_delivery_campaign_products"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_products_productId_idx" ON "public"."free_delivery_campaign_products"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "free_delivery_campaign_excluded_products_freeDeliveryCampaignId_product_key" ON "public"."free_delivery_campaign_excluded_products"("freeDeliveryCampaignId", "productId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_excluded_products_freeDeliveryCampaignId_idx" ON "public"."free_delivery_campaign_excluded_products"("freeDeliveryCampaignId");

-- CreateIndex
CREATE INDEX "free_delivery_campaign_excluded_products_productId_idx" ON "public"."free_delivery_campaign_excluded_products"("productId");

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_categories" ADD CONSTRAINT "free_delivery_campaign_categories_campaign_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "public"."free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_categories" ADD CONSTRAINT "free_delivery_campaign_categories_category_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_sub_categories" ADD CONSTRAINT "free_delivery_campaign_sub_categories_campaign_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "public"."free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_sub_categories" ADD CONSTRAINT "free_delivery_campaign_sub_categories_sub_category_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "public"."sub_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_products" ADD CONSTRAINT "free_delivery_campaign_products_campaign_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "public"."free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_products" ADD CONSTRAINT "free_delivery_campaign_products_product_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_excluded_products" ADD CONSTRAINT "free_delivery_campaign_excluded_products_campaign_fkey" FOREIGN KEY ("freeDeliveryCampaignId") REFERENCES "public"."free_delivery_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."free_delivery_campaign_excluded_products" ADD CONSTRAINT "free_delivery_campaign_excluded_products_product_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
