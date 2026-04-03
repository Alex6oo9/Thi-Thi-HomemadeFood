import request from 'supertest';
import { Express } from 'express';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { IUser } from '../models/User';

/**
 * Create a test user and return the user document
 */
export async function createTestUser(
  email: string,
  password: string,
  role: 'customer' | 'admin' = 'customer'
) {
  const user = await User.create({
    email,
    password,
    role,
    authProvider: 'local',
    isActive: true,
  });
  return user;
}

/**
 * Login a user and return the session cookie
 */
export async function loginUser(
  app: Express,
  email: string,
  password: string
): Promise<string> {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const cookies = response.headers['set-cookie'];
  if (!cookies) {
    throw new Error('No session cookie received');
  }

  // Return the session cookie string
  return Array.isArray(cookies) ? cookies[0] : cookies;
}

/**
 * Create a test product
 */
export async function createTestProduct(
  createdBy: string,
  overrides: Partial<{
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    available: boolean;
    isBestSeller: boolean;
  }> = {}
) {
  const product = await Product.create({
    name: overrides.name || 'Test Product',
    description: overrides.description || 'Test description',
    price: overrides.price || 1000,
    imageUrl: overrides.imageUrl || 'https://example.com/image.jpg',
    available: overrides.available !== undefined ? overrides.available : true,
    isBestSeller: overrides.isBestSeller || false,
    createdBy,
  });
  return product;
}

/**
 * Create a test order
 */
export async function createTestOrder(
  userId: string,
  overrides: Partial<{
    items: Array<{
      productId: string;
      name: string;
      price: number;
      qty: number;
    }>;
    status: 'RECEIVED' | 'PREPARING' | 'DELIVERED';
    notes: string;
    totals: {
      subtotal: number;
      total: number;
    };
  }> = {}
) {
  const order = await Order.create({
    userId,
    items: overrides.items || [
      {
        productId: '507f1f77bcf86cd799439011',
        name: 'Test Product',
        price: 1000,
        qty: 2,
      },
    ],
    status: overrides.status || 'RECEIVED',
    notes: overrides.notes,
    payment: {
      method: 'KBZPAY',
      verified: false,
    },
    totals: overrides.totals || {
      subtotal: 2000,
      total: 2000,
    },
    contactInfo: {
      name: 'Test Customer',
      phone: '09123456789',
      address: '123 Test Street',
    },
  });
  return order;
}

/**
 * Create multiple test products
 */
export async function createMultipleProducts(
  count: number,
  createdBy: string,
  options: {
    namePrefix?: string;
    priceStart?: number;
    priceIncrement?: number;
  } = {}
) {
  const { namePrefix = 'Product', priceStart = 1000, priceIncrement = 500 } = options;

  const products = [];
  for (let i = 1; i <= count; i++) {
    const product = await createTestProduct(createdBy, {
      name: `${namePrefix} ${i}`,
      price: priceStart + (i - 1) * priceIncrement,
      available: i % 2 === 0, // Every other product is available
      isBestSeller: i <= 5, // First 5 are best sellers
    });
    products.push(product);
  }
  return products;
}

/**
 * Create multiple test orders
 */
export async function createMultipleOrders(
  count: number,
  userId: string,
  options: {
    statusPattern?: Array<'RECEIVED' | 'PREPARING' | 'DELIVERED'>;
  } = {}
) {
  const { statusPattern = ['RECEIVED', 'PREPARING', 'DELIVERED'] } = options;

  const orders = [];
  for (let i = 0; i < count; i++) {
    const status = statusPattern[i % statusPattern.length];
    const order = await createTestOrder(userId, {
      status,
      totals: {
        subtotal: 1000 * (i + 1),
        total: 1000 * (i + 1),
      },
    });
    orders.push(order);
  }
  return orders;
}
