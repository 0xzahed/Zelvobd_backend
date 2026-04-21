import { z } from 'zod';

const categoryIdSchema = z.string().trim().min(1, 'Valid category id is required');

const categoryIdsSchema = z
  .array(categoryIdSchema)
  .min(1, 'At least one category id is required');

export const replaceTopCatalogCategoriesSchema = z.object({
  categoryIds: categoryIdsSchema
});

export const getTopCatalogProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, 'categoryId is invalid').optional(),
  subCategoryId: z.string().trim().min(1, 'subCategoryId is invalid').optional()
});

export type ReplaceTopCatalogCategoriesInput = z.infer<typeof replaceTopCatalogCategoriesSchema>;
export type GetTopCatalogProductsQueryInput = z.infer<typeof getTopCatalogProductsQuerySchema>;
