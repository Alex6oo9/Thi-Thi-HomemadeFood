import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/app';
import { createTestUser, loginUser, createMultipleOrders } from '../test/testUtils';

const app = createTestApp();

describe('GET /api/orders - Pagination & Sorting (Admin/Seller)', () => {
  let adminCookie: string;
  let sellerCookie: string;
  let customerId: string;

  beforeEach(async () => {
    // Create users
    const admin = await createTestUser('admin@test.com', 'password123', 'admin');
    const seller = await createTestUser('seller@test.com', 'password123', 'admin');
    const customer = await createTestUser('customer@test.com', 'password123', 'customer');

    customerId = customer._id.toString();

    // Login users
    adminCookie = await loginUser(app, 'admin@test.com', 'password123');
    sellerCookie = await loginUser(app, 'seller@test.com', 'password123');

    // Create 30 test orders with varying statuses
    await createMultipleOrders(30, customerId, {
      statusPattern: ['RECEIVED', 'PREPARING', 'DELIVERED']
    });
  });

  describe('Response Format', () => {
    it('should return paginated response with correct structure', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.orders)).toBe(true);

      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('pages');
    });

    it('should include all order fields in response', async () => {
      const response = await request(app)
        .get('/api/orders?limit=1')
        .set('Cookie', adminCookie)
        .expect(200);

      const order = response.body.orders[0];
      expect(order).toHaveProperty('_id');
      expect(order).toHaveProperty('userId');
      expect(order).toHaveProperty('items');
      expect(order).toHaveProperty('status');
      expect(order).toHaveProperty('payment');
      expect(order).toHaveProperty('totals');
      expect(order).toHaveProperty('contactInfo');
      expect(order).toHaveProperty('createdAt');
      expect(order).toHaveProperty('updatedAt');
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders')
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app)
        .get('/api/orders')
        .set('Cookie', adminCookie)
        .expect(200);
    });

    it('should allow seller access', async () => {
      await request(app)
        .get('/api/orders')
        .set('Cookie', sellerCookie)
        .expect(200);
    });

    it('should deny customer access', async () => {
      const customerCookie = await loginUser(app, 'customer@test.com', 'password123');

      await request(app)
        .get('/api/orders')
        .set('Cookie', customerCookie)
        .expect(403);
    });
  });

  describe('Default Pagination', () => {
    it('should use default pagination (page=1, limit=10)', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBe(30);
      expect(response.body.pagination.pages).toBe(3);
    });
  });

  describe('Custom Pagination', () => {
    it('should respect custom page parameter', async () => {
      const response = await request(app)
        .get('/api/orders?page=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.orders).toHaveLength(10);
    });

    it('should respect custom limit parameter', async () => {
      const response = await request(app)
        .get('/api/orders?limit=15')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(15);
      expect(response.body.pagination.limit).toBe(15);
      expect(response.body.pagination.pages).toBe(2); // 30 / 15 = 2 pages
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/orders?limit=200')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });
  });

  describe('Sorting', () => {
    it('should sort by status in ascending order', async () => {
      const response = await request(app)
        .get('/api/orders?sortBy=status&order=asc&limit=30')
        .set('Cookie', adminCookie)
        .expect(200);

      const statuses = response.body.orders.map((o: any) => o.status);
      const sortedStatuses = [...statuses].sort();
      expect(statuses).toEqual(sortedStatuses);
    });

    it('should sort by total in descending order', async () => {
      const response = await request(app)
        .get('/api/orders?sortBy=total&order=desc&limit=30')
        .set('Cookie', adminCookie)
        .expect(200);

      const totals = response.body.orders.map((o: any) => o.totals.total);
      const sortedTotals = [...totals].sort((a, b) => b - a);
      expect(totals).toEqual(sortedTotals);
    });

    it('should sort by createdAt in descending order (default)', async () => {
      const response = await request(app)
        .get('/api/orders?sortBy=createdAt&order=desc&limit=30')
        .set('Cookie', adminCookie)
        .expect(200);

      const createdAts = response.body.orders.map((o: any) => new Date(o.createdAt).getTime());
      const sortedDates = [...createdAts].sort((a, b) => b - a);
      expect(createdAts).toEqual(sortedDates);
    });

    it('should use createdAt desc as default sort', async () => {
      const response = await request(app)
        .get('/api/orders?limit=30')
        .set('Cookie', adminCookie)
        .expect(200);

      const createdAts = response.body.orders.map((o: any) => new Date(o.createdAt).getTime());
      const sortedDates = [...createdAts].sort((a, b) => b - a);
      expect(createdAts).toEqual(sortedDates);
    });
  });

  describe('Filters with Pagination', () => {
    it('should filter by status and paginate', async () => {
      const response = await request(app)
        .get('/api/orders?status=RECEIVED&limit=5')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.every((o: any) => o.status === 'RECEIVED')).toBe(true);
      expect(response.body.orders).toHaveLength(5);
      expect(response.body.pagination.total).toBe(10); // 30 orders / 3 statuses = 10 per status
    });

    it('should combine status filter with sorting', async () => {
      const response = await request(app)
        .get('/api/orders?status=PREPARING&sortBy=total&order=asc&limit=10')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.every((o: any) => o.status === 'PREPARING')).toBe(true);

      const totals = response.body.orders.map((o: any) => o.totals.total);
      const sortedTotals = [...totals].sort((a, b) => a - b);
      expect(totals).toEqual(sortedTotals);
    });
  });

  describe('Edge Cases', () => {
    it('should handle page beyond total pages', async () => {
      const response = await request(app)
        .get('/api/orders?page=100')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(0);
      expect(response.body.pagination.page).toBe(100);
    });

    it('should handle invalid page parameter', async () => {
      const response = await request(app)
        .get('/api/orders?page=abc')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle invalid limit parameter', async () => {
      const response = await request(app)
        .get('/api/orders?limit=xyz')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.pagination.limit).toBe(10);
    });
  });
});

describe('GET /api/orders/my - Pagination & Sorting (Customer)', () => {
  let customerCookie: string;
  let customerId: string;

  beforeEach(async () => {
    // Create customer
    const customer = await createTestUser('customer@test.com', 'password123', 'customer');
    customerId = customer._id.toString();
    customerCookie = await loginUser(app, 'customer@test.com', 'password123');

    // Create 25 orders for this customer
    await createMultipleOrders(25, customerId, {
      statusPattern: ['RECEIVED', 'PREPARING', 'DELIVERED']
    });
  });

  describe('Response Format', () => {
    it('should return paginated response with correct structure', async () => {
      const response = await request(app)
        .get('/api/orders/my')
        .set('Cookie', customerCookie)
        .expect(200);

      expect(response.body).toHaveProperty('orders');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.orders)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders/my')
        .expect(401);
    });

    it('should only return orders for authenticated user', async () => {
      const response = await request(app)
        .get('/api/orders/my?limit=25')
        .set('Cookie', customerCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThan(0);
      expect(response.body.orders.every((o: any) => o.userId === customerId || o.userId._id === customerId)).toBe(true);
    });
  });

  describe('Default Pagination', () => {
    it('should use default pagination', async () => {
      const response = await request(app)
        .get('/api/orders/my')
        .set('Cookie', customerCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBe(25);
    });
  });

  describe('Custom Pagination', () => {
    it('should respect page and limit parameters', async () => {
      const response = await request(app)
        .get('/api/orders/my?page=2&limit=10')
        .set('Cookie', customerCookie)
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.orders).toHaveLength(10);
    });
  });

  describe('Sorting', () => {
    it('should sort by createdAt desc by default', async () => {
      const response = await request(app)
        .get('/api/orders/my?limit=25')
        .set('Cookie', customerCookie)
        .expect(200);

      const createdAts = response.body.orders.map((o: any) => new Date(o.createdAt).getTime());
      const sortedDates = [...createdAts].sort((a, b) => b - a);
      expect(createdAts).toEqual(sortedDates);
    });

    it('should sort by status', async () => {
      const response = await request(app)
        .get('/api/orders/my?sortBy=status&order=asc&limit=25')
        .set('Cookie', customerCookie)
        .expect(200);

      const statuses = response.body.orders.map((o: any) => o.status);
      const sortedStatuses = [...statuses].sort();
      expect(statuses).toEqual(sortedStatuses);
    });
  });

  describe('Filters with Pagination', () => {
    it('should filter by status', async () => {
      const response = await request(app)
        .get('/api/orders/my?status=DELIVERED')
        .set('Cookie', customerCookie)
        .expect(200);

      expect(response.body.orders.every((o: any) => o.status === 'DELIVERED')).toBe(true);
    });
  });
});
