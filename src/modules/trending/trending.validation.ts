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

const categoryIdSchema = z.string().trim().min(1, 'Valid category id is required');
const subCategoryIdSchema = z.string().trim().min(1, 'Valid subcategory id is required');
const productIdSchema = z.string().trim().min(1, 'Valid product id is required');

const categoryIdsSchema = z.array(categoryIdSchema).min(1, 'At least one category id is required');
const subCategoryIdsSchema = z
  .array(subCategoryIdSchema)
  .min(1, 'At least one subcategory id is required');
const productIdsSchema = z.array(productIdSchema).min(1, 'At least one product id is required');

const hasAtLeastOneValue = (values: Array<unknown[] | undefined>): boolean => {
  return values.some((value) => Array.isArray(value) && value.length > 0);
};

export const updateTrendingCampaignSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Campaign title is required')
      .max(220, 'Campaign title is too long')
      .optional(),
    isActive: booleanFromStringSchema.optional()
  })
  .superRefine((value, context) => {
    if (typeof value.title === 'undefined' && typeof value.isActive === 'undefined') {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['title'],
        message: 'At least one field (title or isActive) is required'
      });
    }
  });

export const updateTrendingCategorySourceSchema = z
  .object({
    addCategoryIds: categoryIdsSchema.optional(),
    removeCategoryIds: categoryIdsSchema.optional()
  })
  .superRefine((value, context) => {
    const addCategoryIds = value.addCategoryIds ?? [];
    const removeCategoryIds = value.removeCategoryIds ?? [];

    if (!hasAtLeastOneValue([value.addCategoryIds, value.removeCategoryIds])) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addCategoryIds'],
        message: 'At least one category id list is required for add or remove'
      });
      return;
    }

    const removeCategoryIdSet = new Set(removeCategoryIds);
    const duplicateOperations = addCategoryIds.filter((categoryId) =>
      removeCategoryIdSet.has(categoryId)
    );

    if (duplicateOperations.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addCategoryIds'],
        message: 'Same category id cannot be added and removed in one request'
      });
    }
  });

export const updateTrendingSubCategorySourceSchema = z
  .object({
    addSubCategoryIds: subCategoryIdsSchema.optional(),
    removeSubCategoryIds: subCategoryIdsSchema.optional()
  })
  .superRefine((value, context) => {
    const addSubCategoryIds = value.addSubCategoryIds ?? [];
    const removeSubCategoryIds = value.removeSubCategoryIds ?? [];

    if (!hasAtLeastOneValue([value.addSubCategoryIds, value.removeSubCategoryIds])) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addSubCategoryIds'],
        message: 'At least one subcategory id list is required for add or remove'
      });
      return;
    }

    const removeSubCategoryIdSet = new Set(removeSubCategoryIds);
    const duplicateOperations = addSubCategoryIds.filter((subCategoryId) =>
      removeSubCategoryIdSet.has(subCategoryId)
    );

    if (duplicateOperations.length > 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['addSubCategoryIds'],
        message: 'Same subcategory id cannot be added and removed in one request'
      });
    }
  });

export const updateTrendingProductSourceSchema = z
  .object({
    addProductIds: productIdsSchema.optional(),
    removeProductIds: productIdsSchema.optional()
  })
  .superRefine((value, context) => {
    const addProductIds = value.addProductIds ?? [];
    const removeProductIds = value.removeProductIds ?? [];

    if (!hasAtLeastOneValue([value.addProductIds, value.removeProductIds])) {
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

export const getTrendingPublicQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, 'categoryId is invalid').optional(),
  subCategoryId: z.string().trim().min(1, 'subCategoryId is invalid').optional()
});

export type UpdateTrendingCampaignInput = z.infer<typeof updateTrendingCampaignSchema>;
export type UpdateTrendingCategorySourceInput = z.infer<
  typeof updateTrendingCategorySourceSchema
>;
export type UpdateTrendingSubCategorySourceInput = z.infer<
  typeof updateTrendingSubCategorySourceSchema
>;
export type UpdateTrendingProductSourceInput = z.infer<
  typeof updateTrendingProductSourceSchema
>;
export type GetTrendingPublicQueryInput = z.infer<typeof getTrendingPublicQuerySchema>;
