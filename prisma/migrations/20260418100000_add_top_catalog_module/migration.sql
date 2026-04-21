-- CreateTable
CREATE TABLE "public"."top_catalog_categories" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "top_catalog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "top_catalog_categories_categoryId_key" ON "public"."top_catalog_categories"("categoryId");

-- CreateIndex
CREATE INDEX "top_catalog_categories_createdAt_idx" ON "public"."top_catalog_categories"("createdAt");

-- AddForeignKey
ALTER TABLE "public"."top_catalog_categories" ADD CONSTRAINT "top_catalog_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
