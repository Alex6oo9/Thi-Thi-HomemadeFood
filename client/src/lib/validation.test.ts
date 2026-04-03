/**
 * Unit tests for validation schemas.
 */

import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  contactInfoSchema,
  createOrderSchema,
  paymentProofSchema,
} from './validation';

describe('loginSchema', () => {
  it('validates correct login data', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'invalid-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'test@example.com',
      password: '',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  it('validates correct registration data', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePass123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects password without uppercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'securepass123!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without lowercase', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SECUREPASS123!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without number', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePassABC!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password without special character', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePass1234',
    });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 12 characters', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'Short1!',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional profile', () => {
    const result = registerSchema.safeParse({
      email: 'test@example.com',
      password: 'SecurePass123!',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('contactInfoSchema', () => {
  it('validates correct contact info', () => {
    const result = contactInfoSchema.safeParse({
      phone: '09123456789',
      address: '123 Main Street, Yangon',
    });
    expect(result.success).toBe(true);
  });

  it('rejects phone with less than 7 digits', () => {
    const result = contactInfoSchema.safeParse({
      phone: '123456',
      address: '123 Main Street, Yangon',
    });
    expect(result.success).toBe(false);
  });

  it('rejects phone with more than 15 digits', () => {
    const result = contactInfoSchema.safeParse({
      phone: '1234567890123456',
      address: '123 Main Street, Yangon',
    });
    expect(result.success).toBe(false);
  });

  it('rejects address shorter than 5 characters', () => {
    const result = contactInfoSchema.safeParse({
      phone: '09123456789',
      address: '123',
    });
    expect(result.success).toBe(false);
  });
});

describe('createOrderSchema', () => {
  it('validates correct order data', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod123', qty: 2 }],
      contactInfo: {
        phone: '09123456789',
        address: '123 Main Street, Yangon',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty items array', () => {
    const result = createOrderSchema.safeParse({
      items: [],
      contactInfo: {
        phone: '09123456789',
        address: '123 Main Street, Yangon',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects quantity less than 1', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod123', qty: 0 }],
      contactInfo: {
        phone: '09123456789',
        address: '123 Main Street, Yangon',
      },
    });
    expect(result.success).toBe(false);
  });

  it('rejects quantity greater than 100', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod123', qty: 101 }],
      contactInfo: {
        phone: '09123456789',
        address: '123 Main Street, Yangon',
      },
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional notes', () => {
    const result = createOrderSchema.safeParse({
      items: [{ productId: 'prod123', qty: 2 }],
      notes: 'Less spicy please',
      contactInfo: {
        phone: '09123456789',
        address: '123 Main Street, Yangon',
      },
    });
    expect(result.success).toBe(true);
  });
});

describe('paymentProofSchema', () => {
  it('validates correct transaction ID', () => {
    const result = paymentProofSchema.safeParse({
      txLast6: '123456',
    });
    expect(result.success).toBe(true);
  });

  it('rejects transaction ID with less than 6 digits', () => {
    const result = paymentProofSchema.safeParse({
      txLast6: '12345',
    });
    expect(result.success).toBe(false);
  });

  it('rejects transaction ID with more than 6 digits', () => {
    const result = paymentProofSchema.safeParse({
      txLast6: '1234567',
    });
    expect(result.success).toBe(false);
  });

  it('rejects transaction ID with non-digits', () => {
    const result = paymentProofSchema.safeParse({
      txLast6: '12345a',
    });
    expect(result.success).toBe(false);
  });
});
