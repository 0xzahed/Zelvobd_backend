import { z } from 'zod';

const FLASH_SALE_DISCOUNT_TYPES = ['PERCENT', 'TAKA'] as const;

const productIdSchema = z.string().trim().min(1, 'Valid product id is required');

const productIdsSchema = z
  .array(productIdSchema)
  .min(1, 'At least one product is required')
  .max(500, 'Too many products in one request');

export const createFlashSaleCampaignSchema = z
  .object({
    title: z.string().trim().min(1, 'Campaign title is required').max(220, 'Campaign title is too long'),
    startAt: z.coerce.date(),
    endAt: z.coerce.date(),
    discountType: z.enum(FLASH_SALE_DISCOUNT_TYPES),
    discountValue: z.coerce.number().positive('Discount value must be greater than 0'),
    productIds: productIdsSchema
  })
  .superRefine((value, context) => {
    if (value.endAt <= value.startAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'End time must be greater than start time'
      });
    }

    if (value.discountType === 'PERCENT' && value.discountValue > 100) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountValue'],
        message: 'Percentage discount cannot be greater than 100'
      });
    }

    if (value.endAt <= new Date()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'End time must be in the future'
      });
    }
  });

export const getFlashSaleCampaignListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
});

export const updateFlashSaleCampaignTimeSchema = z
  .object({
    startAt: z.coerce.date().optional(),
    endAt: z.coerce.date().optional()
  })
  .superRefine((value, context) => {
    const { startAt, endAt } = value;
    const hasStartAt = startAt instanceof Date;
    const hasEndAt = endAt instanceof Date;

    if (!hasStartAt && !hasEndAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['startAt'],
        message: 'At least one of startAt or endAt is required'
      });
      return;
    }

    if (hasStartAt && hasEndAt && endAt <= startAt) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endAt'],
        message: 'End time must be greater than start time'
      });
    }
  });

export const updateFlashSaleCampaignProductsSchema = z
  .object({
    addProductIds: productIdsSchema.optional(),
    removeProductIds: productIdsSchema.optional()
  })
  .superRefine((value, context) => {
    const addProductIds = value.addProductIds ?? [];
    const removeProductIds = value.removeProductIds ?? [];

    if (addProductIds.length === 0 && removeProductIds.length === 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addProductIds'],
        message: 'At least one product id list is required for add or remove'
      });
      return;
    }

    const removeProductIdSet = new Set(removeProductIds);
    const duplicateOperations = addProductIds.filter((productId) => removeProductIdSet.has(productId));

    if (duplicateOperations.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addProductIds'],
        message: 'Same product id cannot be added and removed in one request'
      });
    }
  });

export const getActiveFlashSaleProductsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, 'categoryId is invalid').optional()
});

export type CreateFlashSaleCampaignInput = z.infer<typeof createFlashSaleCampaignSchema>;
export type GetFlashSaleCampaignListQueryInput = z.infer<typeof getFlashSaleCampaignListQuerySchema>;
export type UpdateFlashSaleCampaignTimeInput = z.infer<typeof updateFlashSaleCampaignTimeSchema>;
export type UpdateFlashSaleCampaignProductsInput = z.infer<
  typeof updateFlashSaleCampaignProductsSchema
>;
export type GetActiveFlashSaleProductsQueryInput = z.infer<
  typeof getActiveFlashSaleProductsQuerySchema
>;
