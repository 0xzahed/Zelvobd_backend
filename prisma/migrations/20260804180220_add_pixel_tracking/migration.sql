-- AlterTable
ALTER TABLE "landing_pages" ADD COLUMN     "sliderSection" JSONB;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "fbc" TEXT,
ADD COLUMN     "fbp" TEXT,
ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "userAgent" TEXT;
