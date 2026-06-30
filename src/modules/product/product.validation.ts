import { z } from 'zod';

const parseJsonFromString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

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

const emptyStringToNull = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? null : trimmedValue;
};

const optionalNullableStringSchema = (maxLength: number, errorMessage: string) =>
  z.preprocess(
    emptyStringToNull,
    z.string().trim().max(maxLength, errorMessage).nullable().optional()
  );

const optionalFloatFromStringSchema = z.preprocess((value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}, z.number().min(0, 'Rating cannot be less than 0').max(5, 'Rating cannot be more than 5').optional());

const quillDeltaSchema = z
  .object({
    ops: z.array(z.record(z.string(), z.unknown())).min(1, 'Rich text delta content is required')
  })
  .passthrough();

const specificationSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  information: z.string().trim().min(1, 'Information is required')
});

const createProductVariantSchema = z
  .object({
    actualPrice: z.coerce.number().positive('Variant actual price must be greater than 0'),
    discountedPrice: z.coerce
      .number()
      .nonnegative('Variant discounted price cannot be negative'),
    color: z.string().trim().min(1, 'Variant color is required').max(80, 'Variant color is too long'),
    colorCode: optionalNullableStringSchema(20, 'Variant color code is too long'),
    size: optionalNullableStringSchema(80, 'Variant size is too long')
  })
  .superRefine((value, context) => {
    if (value.discountedPrice > value.actualPrice) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['discountedPrice'],
        message: 'Variant discounted price cannot be greater than actual price'
      });
    }
  });

export const createProductSchema = z
  .object({
    categoryId: z.string().trim().min(1, 'Category is required'),
    subCategoryId: z.string().trim().min(1, 'Subcategory is required'),
    title: z.string().trim().min(1, 'Product title is required').max(220, 'Product title is too long'),
    brand: optionalNullableStringSchema(120, 'Brand is too long'),
    descriptionDelta: z.preprocess(parseJsonFromString, quillDeltaSchema),
    descriptionHtml: z.string().trim().min(1, 'Description HTML is required'),
    extraDescriptionDelta: z.preprocess(parseJsonFromString, quillDeltaSchema).optional(),
    extraDescriptionHtml: z
      .string()
      .trim()
      .min(1, 'Extra description HTML cannot be empty')
      .optional(),
    weight: z.string().trim().min(1, 'Product weight is required').max(80, 'Product weight is too long'),
    material: optionalNullableStringSchema(120, 'Material is too long'),
    rating: optionalFloatFromStringSchema,
    stock: booleanFromStringSchema,
    availability: booleanFromStringSchema,
    variantLabel: optionalNullableStringSchema(80, 'Variant label is too long'),
    specifications: z.preprocess(
      parseJsonFromString,
      z.array(specificationSchema).max(50, 'Too many specifications').optional()
    ),
    variants: z.preprocess(
      parseJsonFromString,
      z.array(createProductVariantSchema).min(1, 'At least one product variant is required').max(50)
    )
  })
  .superRefine((value, context) => {
    const hasExtraDescriptionDelta = typeof value.extraDescriptionDelta !== 'undefined';
    const hasExtraDescriptionHtml = typeof value.extraDescriptionHtml !== 'undefined';

    if (hasExtraDescriptionDelta !== hasExtraDescriptionHtml) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['extraDescriptionDelta'],
        message: 'Provide both extraDescriptionDelta and extraDescriptionHtml together, or omit both'
      });
    }
  });

export const updateProductSchema = z
  .object({
    categoryId: z.string().trim().min(1, 'Category is required').optional(),
    subCategoryId: z.string().trim().min(1, 'Subcategory is required').optional(),
    title: z.string().trim().min(1, 'Product title is required').max(220, 'Product title is too long').optional(),
    brand: optionalNullableStringSchema(120, 'Brand is too long'),
    descriptionDelta: z.preprocess(parseJsonFromString, quillDeltaSchema).optional(),
    descriptionHtml: z.string().trim().min(1, 'Description HTML is required').optional(),
    extraDescriptionDelta: z.preprocess(parseJsonFromString, quillDeltaSchema).optional(),
    extraDescriptionHtml: z
      .string()
      .trim()
      .min(1, 'Extra description HTML cannot be empty')
      .optional(),
    weight: z.string().trim().min(1, 'Product weight is required').max(80, 'Product weight is too long').optional(),
    material: optionalNullableStringSchema(120, 'Material is too long'),
    rating: optionalFloatFromStringSchema,
    stock: booleanFromStringSchema.optional(),
    availability: booleanFromStringSchema.optional(),
    variantLabel: optionalNullableStringSchema(80, 'Variant label is too long'),
    deleteVideo: booleanFromStringSchema.optional(),
    specifications: z.preprocess(
      parseJsonFromString,
      z.array(specificationSchema).max(50, 'Too many specifications').optional()
    ),
    variants: z.preprocess(
      parseJsonFromString,
      z.array(createProductVariantSchema).min(1, 'At least one product variant is required').max(50)
    ).optional()
  })
  .superRefine((value, context) => {
    const hasDescriptionDelta = typeof value.descriptionDelta !== 'undefined';
    const hasDescriptionHtml = typeof value.descriptionHtml !== 'undefined';

    if (hasDescriptionDelta !== hasDescriptionHtml) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['descriptionDelta'],
        message: 'Provide both descriptionDelta and descriptionHtml together, or omit both'
      });
    }

    const hasExtraDescriptionDelta = typeof value.extraDescriptionDelta !== 'undefined';
    const hasExtraDescriptionHtml = typeof value.extraDescriptionHtml !== 'undefined';

    if (hasExtraDescriptionDelta !== hasExtraDescriptionHtml) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['extraDescriptionDelta'],
        message: 'Provide both extraDescriptionDelta and extraDescriptionHtml together, or omit both'
      });
    }
  });

export const getProductListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  categoryId: z.string().trim().min(1, 'categoryId is invalid').optional(),
  subCategoryId: z.string().trim().min(1, 'subCategoryId is invalid').optional()
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type GetProductListQueryInput = z.infer<typeof getProductListQuerySchema>;
