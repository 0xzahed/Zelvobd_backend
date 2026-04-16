import { z } from 'zod';

export const createBannerSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(220, 'Title is too long'),
  url: z.string().trim().url('Valid URL is required')
});

export const updateBannerSchema = z.object({
  title: z.string().trim().min(1, 'Title cannot be empty').max(220, 'Title is too long').optional(),
  url: z.string().trim().url('Valid URL is required').optional()
});
