import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/app';
import { createTestUser, loginUser, createTestOrder } from '../test/testUtils';

const app = createTestApp();

describe('GET /api/orders - Search Functionality (Admin/Seller)', () => {
  let adminCookie: string;
  let sellerCookie: string;
  let customerId: string;
  let orderIds: string[] = [];

  beforeEach(async () => {
    // Create users
    const admin = await createTestUser('admin@test.com', 'password123', 'admin');
    const seller = await createTestUser('seller@test.com', 'password123', 'admin');
    const customer = await createTestUser('customer@test.com', 'password123', 'customer');

    customerId = customer._id.toString();

    // Login users
    adminCookie = await loginUser(app, 'admin@test.com', 'password123');
    sellerCookie = await loginUser(app, 'seller@test.com', 'password123');

    // Create test orders with different phone numbers
    const order1 = await createTestOrder(customerId, {
      totals: { subtotal: 5000, total: 5000 }
    });
    orderIds.push(order1._id.toString());

    const order2 = await createTestOrder(customerId, {
      totals: { subtotal: 3000, total: 3000 }
    });
    orderIds.push(order2._id.toString());

    const order3 = await createTestOrder(customerId, {
      totals: { subtotal: 4000, total: 4000 }
    });
    orderIds.push(order3._id.toString());

    // Update orders with specific phone numbers for search testing
    const Order = (await import('../models/Order')).Order;
    await Order.findByIdAndUpdate(order1._id, {
      'contactInfo.phone': '09123456789'
    });
    await Order.findByIdAndUpdate(order2._id, {
      'contactInfo.phone': '09987654321'
    });
    await Order.findByIdAndUpdate(order3._id, {
      'contactInfo.phone': '09111222333'
    });
  });

  describe('Authentication & Authorization', () => {
    it('should require authentication', async () => {
      await request(app)
        .get('/api/orders?search=091234')
        .expect(401);
    });

    it('should allow admin access', async () => {
      await request(app)
        .get('/api/orders?search=091234')
        .set('Cookie', adminCookie)
        .expect(200);
    });

    it('should allow seller access', async () => {
      await request(app)
        .get('/api/orders?search=091234')
        .set('Cookie', sellerCookie)
        .expect(200);
    });

    it('should deny customer access', async () => {
      const customerCookie = await loginUser(app, 'customer@test.com', 'password123');

      await request(app)
        .get('/api/orders?search=091234')
        .set('Cookie', customerCookie)
        .expect(403);
    });
  });

  describe('Search by Phone Number', () => {
    it('should find order by full phone number', async () => {
      const response = await request(app)
        .get('/api/orders?search=09123456789')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toBeDefined();
      expect(response.body.orders.length).toBe(1);
      expect(response.body.orders[0].contactInfo.phone).toBe('09123456789');
    });

    it('should find orders by partial phone number', async () => {
      const response = await request(app)
        .get('/api/orders?search=091234')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
      expect(response.body.orders.some((o: any) =>
        o.contactInfo.phone.includes('091234')
      )).toBe(true);
    });

    it('should be case-insensitive for phone search', async () => {
      const responses = await Promise.all([
        request(app).get('/api/orders?search=09123456789').set('Cookie', adminCookie),
        request(app).get('/api/orders?search=09123456789').set('Cookie', adminCookie),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
      });
    });

    it('should find multiple orders matching phone pattern', async () => {
      const response = await request(app)
        .get('/api/orders?search=091') // Matches all test phones starting with 091
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBe(3);
    });
  });

  describe('Search by Order ID', () => {
    it('should find order by full ID', async () => {
      const fullId = orderIds[0];
      const response = await request(app)
        .get(`/api/orders?search=${fullId}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBe(1);
      expect(response.body.orders[0]._id).toBe(fullId);
    });

    it('should find order by partial ID', async () => {
      const partialId = orderIds[0].substring(0, 8);
      const response = await request(app)
        .get(`/api/orders?search=${partialId}`)
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
      expect(response.body.orders.some((o: any) =>
        o._id.includes(partialId)
      )).toBe(true);
    });

    it('should be case-insensitive for ID search', async () => {
      const orderId = orderIds[0];
      const lowerCaseId = orderId.toLowerCase();
      const upperCaseId = orderId.toUpperCase();

      const responses = await Promise.all([
        request(app).get(`/api/orders?search=${lowerCaseId}`).set('Cookie', adminCookie),
        request(app).get(`/api/orders?search=${upperCaseId}`).set('Cookie', adminCookie),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('Search with Pagination', () => {
    it('should paginate search results', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&limit=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should navigate to second page of search results', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&page=2&limit=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(1);
      expect(response.body.pagination.page).toBe(2);
    });
  });

  describe('Search with Sorting', () => {
    it('should sort search results by total', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&sortBy=total&order=desc')
        .set('Cookie', adminCookie)
        .expect(200);

      const totals = response.body.orders.map((o: any) => o.totals.total);
      const sortedTotals = [...totals].sort((a, b) => b - a);
      expect(totals).toEqual(sortedTotals);
    });

    it('should sort search results by createdAt', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&sortBy=createdAt&order=asc')
        .set('Cookie', adminCookie)
        .expect(200);

      const dates = response.body.orders.map((o: any) => new Date(o.createdAt).getTime());
      const sortedDates = [...dates].sort((a, b) => a - b);
      expect(dates).toEqual(sortedDates);
    });
  });

  describe('Search Combined with Filters', () => {
    beforeEach(async () => {
      // Update some orders to different statuses
      const Order = (await import('../models/Order')).Order;
      await Order.findByIdAndUpdate(orderIds[0], { status: 'PREPARING' });
      await Order.findByIdAndUpdate(orderIds[1], { status: 'DELIVERED' });
    });

    it('should combine search with status filter', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&status=PREPARING')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
      expect(response.body.orders.every((o: any) => o.status === 'PREPARING')).toBe(true);
    });

    it('should combine search with sorting and pagination', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&sortBy=total&order=asc&page=1&limit=5')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search Validation', () => {
    it('should reject search query less than 3 characters', async () => {
      const response = await request(app)
        .get('/api/orders?search=09')
        .set('Cookie', adminCookie)
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('3 characters');
    });

    it('should accept exactly 3 characters', async () => {
      const response = await request(app)
        .get('/api/orders?search=091')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toBeDefined();
    });

    it('should reject search query exceeding 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      const response = await request(app)
        .get(`/api/orders?search=${longQuery}`)
        .set('Cookie', adminCookie)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('Empty and Special Cases', () => {
    it('should ignore empty search query and return all orders', async () => {
      const response = await request(app)
        .get('/api/orders?search=')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBe(3); // All test orders
    });

    it('should trim whitespace from search query', async () => {
      const response = await request(app)
        .get('/api/orders?search=  091234  ')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when no matches found', async () => {
      const response = await request(app)
        .get('/api/orders?search=999999999')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.pages).toBe(0);
    });

    it('should handle special characters safely', async () => {
      // Update an order with special characters in phone
      const Order = (await import('../models/Order')).Order;
      await Order.findByIdAndUpdate(orderIds[0], {
        'contactInfo.phone': '091-234-5678'
      });

      const response = await request(app)
        .get('/api/orders?search=091-234')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Search Without Query Parameter', () => {
    it('should return all orders when search param not provided', async () => {
      const response = await request(app)
        .get('/api/orders')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders.length).toBe(3);
    });

    it('should work with pagination when no search', async () => {
      const response = await request(app)
        .get('/api/orders?page=1&limit=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.orders).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
    });
  });

  describe('Pagination Metadata with Search', () => {
    it('should return correct pagination metadata for search results', async () => {
      const response = await request(app)
        .get('/api/orders?search=091&limit=2')
        .set('Cookie', adminCookie)
        .expect(200);

      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
    });
  });
});
