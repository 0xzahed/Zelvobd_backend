ALTER TABLE "products"
ADD COLUMN "brand" TEXT,
ALTER COLUMN "material" DROP NOT NULL;

ALTER TABLE "product_variants"
ALTER COLUMN "size" DROP NOT NULL;
