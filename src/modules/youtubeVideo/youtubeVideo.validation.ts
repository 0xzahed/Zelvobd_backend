import { z } from 'zod';

const youtubeHostPattern = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i;

const youtubeUrlSchema = z
  .string()
  .trim()
  .url('Valid URL is required')
  .refine((value) => {
    try {
      const parsedUrl = new URL(value);
      const hostname = parsedUrl.hostname.toLowerCase();
      return youtubeHostPattern.test(hostname);
    } catch {
      return false;
    }
  }, 'Only YouTube video link is allowed');

export const createYoutubeVideoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  url: youtubeUrlSchema
});

export const updateYoutubeVideoSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').optional(),
  url: youtubeUrlSchema.optional()
});
