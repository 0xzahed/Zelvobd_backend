import { z } from 'zod';

export const createCategoryBannerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  subTitle: z.string().trim().optional(),
  url: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, 'Category is required')
});

export const updateCategoryBannerSchema = z.object({
  title: z.string().trim().optional(),
  subTitle: z.string().trim().optional(),
  url: z.string().trim().optional(),
  categoryId: z.string().trim().optional()
});
