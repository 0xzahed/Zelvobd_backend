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

export const landingPageCheckoutSchema = z.object({
  customerName: z.string().trim().min(1, 'Name is required'),
  customerPhone: z.string().trim().min(1, 'Phone is required'),
  address: z.string().trim().min(1, 'Address is required'),
  district: z.string().trim().nullable().optional(),
  landingPageId: z.string().trim().min(1, 'Landing page ID is required'),
  quantity: z.number().int().positive().default(1),
  price: z.number().positive(),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING', 'PROCESSING', 'HOLD', 'PICKUP', 'DELIVERED', 'CUSTOMER_CANCELLED', 'CANCELLED', 'TRASH'
  ]),
});

const updateOrderItemSchema = z.object({
  id: z.string().trim().optional(),
  productId: z.string().trim().optional(),
  productName: z.string().trim().min(1, 'Product name is required'),
  productImage: z.string().trim().nullable().optional(),
  price: z.number().nonnegative('Price must be non-negative'),
  quantity: z.number().int().positive('Quantity must be positive'),
  color: z.string().trim().nullable().optional(),
  size: z.string().trim().nullable().optional(),
});

export const updateOrderSchema = z.object({
  customerName: z.string().trim().min(1, 'Name is required').optional(),
  customerPhone: z.string().trim().min(1, 'Phone is required').optional(),
  address: z.string().trim().min(1, 'Address is required').optional(),
  district: z.string().trim().min(1, 'District is required').optional(),
  union: z.string().trim().nullable().optional(),
  orderNotes: z.string().trim().nullable().optional(),
  items: z.array(updateOrderItemSchema).min(1, 'At least one item is required').optional(),
  shippingCharge: z.number().nonnegative().optional(),
  discountAmount: z.number().nonnegative().optional(),
  promoCode: z.string().trim().nullable().optional(),
});

export const getOrdersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(10000).default(20),
  search: z.string().trim().optional(),
  status: z.enum([
    'PENDING', 'PROCESSING', 'HOLD', 'PICKUP', 'DELIVERED', 'CUSTOMER_CANCELLED', 'CANCELLED', 'TRASH'
  ]).optional(),
});
