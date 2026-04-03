/**
 * Zod validation schemas matching the server's validation rules.
 * Used for client-side validation before API calls.
 */

import { z } from 'zod';

// Password must match server requirements:
// - Min 12 characters
// - At least one uppercase, lowercase, number, special char
const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

export const registerSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .max(255, 'Email must be less than 255 characters'),
  password: passwordSchema,
  profile: z
    .object({
      firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters')
        .optional(),
      lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters')
        .optional(),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const contactInfoSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  phone: z
    .string()
    .regex(/^\d{7,15}$/, 'Phone must be 7-15 digits'),
  address: z
    .string()
    .min(5, 'Address must be at least 5 characters')
    .max(500, 'Address must be less than 500 characters'),
});

export const orderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  qty: z
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(100, 'Quantity cannot exceed 100'),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  contactInfo: contactInfoSchema,
});

export const paymentProofSchema = z.object({
  txLast6: z
    .string()
    .regex(/^\d{6}$/, 'Transaction ID must be exactly 6 digits'),
});

export const productSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be less than 2000 characters'),
  price: z
    .number()
    .min(0.01, 'Price must be at least 0.01')
    .max(10000000, 'Price cannot exceed 10,000,000'),
  imageUrl: z.string().url('Invalid image URL'),
  isBestSeller: z.boolean().optional(),
});

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ContactInfoInput = z.infer<typeof contactInfoSchema>;
export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type PaymentProofInput = z.infer<typeof paymentProofSchema>;
export type ProductInput = z.infer<typeof productSchema>;
