
import { z } from 'zod';

export const createAdminSchema = z.object({
	email: z.string().trim().toLowerCase().email('A valid email is required'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	isActive: z.boolean().optional()
});

export const updateAdminSchema = z.object({
	email: z.string().trim().toLowerCase().email('A valid email is required').optional(),
	password: z.string().min(8, 'Password must be at least 8 characters').optional(),
	isActive: z.boolean().optional()
});
