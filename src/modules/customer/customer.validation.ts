import { z } from 'zod';

export const getCustomersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(500).default(20),
  search: z.string().trim().optional(),
});

export type GetCustomersQueryInput = z.infer<typeof getCustomersQuerySchema>;
