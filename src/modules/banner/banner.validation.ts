import { z } from 'zod';

const booleanFromStringSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true') {
      return true;
    }

    if (normalized === 'false') {
      return false;
    }
  }

  return value;
}, z.boolean());

export const createBannerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(220, 'Title is too long'),
  subTitle: z.string().trim().max(2000, 'Subtitle is too long').optional(),
  url: z.string().trim().url('Valid URL is required'),
  categoryId: z.string().trim().min(1, 'Category is required'),
  inHomePage: booleanFromStringSchema
});

export const updateBannerSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(220, 'Title is too long').optional(),
  subTitle: z.string().trim().max(2000, 'Subtitle is too long').optional(),
  url: z.string().trim().url('Valid URL is required').optional(),
  categoryId: z.string().trim().min(1, 'Category is required').optional(),
  inHomePage: booleanFromStringSchema.optional()
});
