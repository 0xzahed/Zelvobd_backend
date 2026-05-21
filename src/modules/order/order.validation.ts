import { z } from 'zod';

const orderItemSchema = z.object({
  productId: z.string().trim().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  color: z.string().trim().nullable().optional(),
  size: z.string().trim().nullable().optional(),
});

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(1, 'Name is required'),
  customerPhone: z.string().trim().min(1, 'Phone is required'),
  address: z.string().trim().min(1, 'Address is required'),
  district: z.string().trim().min(1, 'District is required'),
  union: z.string().trim().nullable().optional(),
  orderNotes: z.string().trim().nullable().optional(),
  items: z.array(orderItemSchema).min(1, 'Cart cannot be empty'),
  promoCode: z.string().trim().nullable().optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'PROCESSING', 'HOLD', 'PICKUP', 'DELIVERED', 'CUSTOMER_CANCELLED', 'CANCELLED', 'TRASH'
  ]),
});

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().optional(),
  status: z.enum([
    'PENDING', 'PROCESSING', 'HOLD', 'PICKUP', 'DELIVERED', 'CUSTOMER_CANCELLED', 'CANCELLED', 'TRASH'
  ]).optional(),
});
