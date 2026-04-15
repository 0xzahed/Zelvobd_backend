import { z } from 'zod';

const PRODUCT_STATUS_VALUES = [
  'PENDING',
  'PROCESSING',
  'HOLD',
  'PICKUP',
  'DELIVERED',
  'PARTIAL',
  'REJECT',
  'CANCEL',
  'NOT_COMPLETED',
  'TRASH'
] as const;

const productStatusInputMap: Record<string, (typeof PRODUCT_STATUS_VALUES)[number]> = {
  pending: 'PENDING',
  processing: 'PROCESSING',
  hold: 'HOLD',
  pickup: 'PICKUP',
  delivered: 'DELIVERED',
  partial: 'PARTIAL',
  reject: 'REJECT',
  cancel: 'CANCEL',
  'not completed': 'NOT_COMPLETED',
  not_completed: 'NOT_COMPLETED',
  trash: 'TRASH'
};

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

const productStatusSchema = z
  .preprocess((value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const normalized = value.trim().toLowerCase().replace(/_/g, ' ');
    return productStatusInputMap[normalized] ?? value;
  }, z.enum(PRODUCT_STATUS_VALUES))
  .default('PENDING');

const quillDeltaSchema = z
  .object({
    ops: z.array(z.record(z.string(), z.unknown())).min(1, 'Rich text delta content is required')
  })
  .passthrough();

const createProductVariantSchema = z
  .object({
    actualPrice: z.coerce.number().positive('Variant actual price must be greater than 0'),
    discountedPrice: z.coerce
      .number()
      .nonnegative('Variant discounted price cannot be negative'),
    color: z.string().trim().min(1, 'Variant color is required').max(80, 'Variant color is too long'),
    size: z.string().trim().min(1, 'Variant size is required').max(80, 'Variant size is too long')
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
    descriptionDelta: z.preprocess(parseJsonFromString, quillDeltaSchema),
    descriptionHtml: z.string().trim().min(1, 'Description HTML is required'),
    extraDescriptionDelta: z.preprocess(parseJsonFromString, quillDeltaSchema).optional(),
    extraDescriptionHtml: z
      .string()
      .trim()
      .min(1, 'Extra description HTML cannot be empty')
      .optional(),
    weight: z.string().trim().min(1, 'Product weight is required').max(80, 'Product weight is too long'),
    material: z.string().trim().min(1, 'Material is required').max(120, 'Material is too long'),
    stock: booleanFromStringSchema,
    availability: booleanFromStringSchema,
    status: productStatusSchema,
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

export type CreateProductInput = z.infer<typeof createProductSchema>;
