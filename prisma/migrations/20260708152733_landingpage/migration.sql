-- AlterTable
ALTER TABLE "order_items" ALTER COLUMN "productId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "landing_pages" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "colorPalette" TEXT NOT NULL DEFAULT 'blue',
    "heroSection" JSONB,
    "tableSection" JSONB,
    "featureCards" JSONB,
    "timerSection" JSONB,
    "videoSection" JSONB,
    "bulletPointsSection" JSONB,
    "tipsSection" JSONB,
    "checkoutSection" JSONB,
    "faqSection" JSONB,
    "whatsappSection" JSONB,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "landing_pages_slug_key" ON "landing_pages"("slug");

-- AddForeignKey
ALTER TABLE "landing_pages" ADD CONSTRAINT "landing_pages_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
