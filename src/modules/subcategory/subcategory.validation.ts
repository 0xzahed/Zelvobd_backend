import { z } from 'zod';

export const createSubCategorySchema = z.object({
  categoryId: z.string().trim().min(1, 'Category is required'),
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long')
});

export const updateSubCategorySchema = z.object({
  categoryId: z.string().trim().min(1, 'Category is required').optional(),
  title: z.string().trim().min(1, 'Title cannot be empty').max(120, 'Title is too long').optional()
});

export const getSubCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, 'categoryId is invalid').optional()
});
