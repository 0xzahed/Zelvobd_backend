import { z } from 'zod';

const booleanFromStringSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return value;
}, z.boolean());

const optionalDateSchema = z.preprocess((arg) => {
  if (arg === '' || arg === null || arg === undefined) return null;
  return new Date(arg as string | number);
}, z.date().nullable().optional());

export const createPromoSchema = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters').toUpperCase(),
  discountType: z.enum(['AMOUNT', 'PERCENT']),
  discountValue: z.coerce.number().positive('Discount value must be positive'),
  minOrderValue: z.coerce.number().nonnegative('Min order value cannot be negative').optional(),
  maxDiscount: z.coerce.number().nonnegative('Max discount cannot be negative').optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  isActive: booleanFromStringSchema.optional().default(true),
}).refine(data => {
  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    return false;
  }
  return true;
}, {
  message: "Start date must be before end date",
  path: ["endDate"]
});

export const updatePromoSchema = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters').toUpperCase().optional(),
  discountType: z.enum(['AMOUNT', 'PERCENT']).optional(),
  discountValue: z.coerce.number().positive('Discount value must be positive').optional(),
  minOrderValue: z.coerce.number().nonnegative('Min order value cannot be negative').nullable().optional(),
  maxDiscount: z.coerce.number().nonnegative('Max discount cannot be negative').nullable().optional(),
  startDate: optionalDateSchema,
  endDate: optionalDateSchema,
  isActive: booleanFromStringSchema.optional(),
});

export const applyPromoSchema = z.object({
  code: z.string().trim().toUpperCase(),
  orderValue: z.coerce.number().nonnegative('Order value cannot be negative'),
});

export const getPromosQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
});
