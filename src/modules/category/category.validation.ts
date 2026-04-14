import { z } from 'zod';

export const createCategorySchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(120, 'Title is too long')
});

export const updateCategorySchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(120, 'Title is too long').optional()
});

export const getCategoryListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional()
});
