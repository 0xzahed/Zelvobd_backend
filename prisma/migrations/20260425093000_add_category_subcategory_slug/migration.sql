-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN "slug" TEXT;

-- AlterTable
ALTER TABLE "public"."sub_categories" ADD COLUMN "slug" TEXT;

-- Populate existing rows with unique fallback slugs
UPDATE "public"."categories"
SET "slug" = CONCAT('category-', "id")
WHERE "slug" IS NULL;

UPDATE "public"."sub_categories"
SET "slug" = CONCAT('subcategory-', "id")
WHERE "slug" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sub_categories_slug_key" ON "public"."sub_categories"("slug");
