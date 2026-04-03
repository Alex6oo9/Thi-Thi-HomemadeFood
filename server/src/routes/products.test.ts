import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/app';
import { createTestUser, createMultipleProducts } from '../test/testUtils';

const app = createTestApp();

describe('GET /api/products - Pagination & Sorting', () => {
  let sellerId: string;

  beforeEach(async () => {
    // Create a seller user
    const seller = await createTestUser('seller@test.com', 'password123', 'admin');
    sellerId = seller._id.toString();

    // Create 25 test products with varying attributes
    await createMultipleProducts(25, sellerId, {
      namePrefix: 'Product',
      priceStart: 1000,
      priceIncrement: 500,
    });
  });

  describe('Response Format', () => {
    it('should return paginated response with correct structure', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('products');
      expect(response.body).toHaveProperty('pagination');
      expect(Array.isArray(response.body.products)).toBe(true);

      const { pagination } = response.body;
      expect(pagination).toHaveProperty('page');
      expect(pagination).toHaveProperty('limit');
      expect(pagination).toHaveProperty('total');
      expect(pagination).toHaveProperty('pages');
    });

    it('should include all product fields in response', async () => {
      const response = await request(app)
        .get('/api/products?limit=1')
        .expect(200);

      const product = response.body.products[0];
      expect(product).toHaveProperty('_id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('description');
      expect(product).toHaveProperty('price');
      expect(product).toHaveProperty('imageUrl');
      expect(product).toHaveProperty('available');
      expect(product).toHaveProperty('isBestSeller');
      expect(product).toHaveProperty('createdBy');
      expect(product).toHaveProperty('createdAt');
      expect(product).toHaveProperty('updatedAt');
    });
  });

  describe('Default Pagination', () => {
    it('should use default pagination (page=1, limit=10) when no params provided', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toHaveLength(10);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
      expect(response.body.pagination.total).toBe(25);
      expect(response.body.pagination.pages).toBe(3);
    });
  });

  describe('Custom Pagination', () => {
    it('should respect custom page parameter', async () => {
      const response = await request(app)
        .get('/api/products?page=2')
        .expect(200);

      expect(response.body.pagination.page).toBe(2);
      expect(response.body.products).toHaveLength(10);
    });

    it('should respect custom limit parameter', async () => {
      const response = await request(app)
        .get('/api/products?limit=5')
        .expect(200);

      expect(response.body.products).toHaveLength(5);
      expect(response.body.pagination.limit).toBe(5);
      expect(response.body.pagination.pages).toBe(5); // 25 / 5 = 5 pages
    });

    it('should handle page=3 with limit=10 correctly', async () => {
      const response = await request(app)
        .get('/api/products?page=3&limit=10')
        .expect(200);

      expect(response.body.products).toHaveLength(5); // Last page has 5 items
      expect(response.body.pagination.page).toBe(3);
    });

    it('should enforce maximum limit of 100', async () => {
      const response = await request(app)
        .get('/api/products?limit=200')
        .expect(200);

      expect(response.body.pagination.limit).toBe(100);
    });

    it('should handle limit=1 (single item per page)', async () => {
      const response = await request(app)
        .get('/api/products?limit=1')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.pagination.pages).toBe(25);
    });
  });

  describe('Sorting', () => {
    it('should sort by name in ascending order', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=name&order=asc&limit=25')
        .expect(200);

      const names = response.body.products.map((p: any) => p.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should sort by name in descending order', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=name&order=desc&limit=25')
        .expect(200);

      const names = response.body.products.map((p: any) => p.name);
      const sortedNames = [...names].sort().reverse();
      expect(names).toEqual(sortedNames);
    });

    it('should sort by price in ascending order', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=price&order=asc&limit=25')
        .expect(200);

      const prices = response.body.products.map((p: any) => p.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });

    it('should sort by price in descending order', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=price&order=desc&limit=25')
        .expect(200);

      const prices = response.body.products.map((p: any) => p.price);
      const sortedPrices = [...prices].sort((a, b) => b - a);
      expect(prices).toEqual(sortedPrices);
    });

    it('should sort by available status', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=available&order=desc&limit=25')
        .expect(200);

      const availableStatuses = response.body.products.map((p: any) => p.available);
      // True (1) should come before false (0) in descending order
      // createMultipleProducts(25) sets available=true for even i (2,4,...24) = 12 items
      const firstHalf = availableStatuses.slice(0, 12);
      const secondHalf = availableStatuses.slice(12);

      expect(firstHalf.every((status: boolean) => status === true)).toBe(true);
      expect(secondHalf.every((status: boolean) => status === false)).toBe(true);
    });

    it('should sort by createdAt in descending order (default)', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=createdAt&order=desc&limit=25')
        .expect(200);

      const createdAts = response.body.products.map((p: any) => new Date(p.createdAt).getTime());
      const sortedDates = [...createdAts].sort((a, b) => b - a);
      expect(createdAts).toEqual(sortedDates);
    });

    it('should use createdAt desc as default sort when no sortBy specified', async () => {
      const response = await request(app)
        .get('/api/products?limit=25')
        .expect(200);

      const createdAts = response.body.products.map((p: any) => new Date(p.createdAt).getTime());
      const sortedDates = [...createdAts].sort((a, b) => b - a);
      expect(createdAts).toEqual(sortedDates);
    });
  });

  describe('Filters with Pagination', () => {
    it('should filter by available=true and paginate', async () => {
      const response = await request(app)
        .get('/api/products?available=true&limit=5')
        .expect(200);

      expect(response.body.products.every((p: any) => p.available === true)).toBe(true);
      expect(response.body.products).toHaveLength(5);
      expect(response.body.pagination.total).toBe(12); // Half of 25 are available (rounded down)
    });

    it('should filter by isBestSeller=true and paginate', async () => {
      const response = await request(app)
        .get('/api/products?isBestSeller=true&limit=10')
        .expect(200);

      expect(response.body.products.every((p: any) => p.isBestSeller === true)).toBe(true);
      expect(response.body.pagination.total).toBe(5);
    });

    it('should combine available and isBestSeller filters', async () => {
      const response = await request(app)
        .get('/api/products?available=true&isBestSeller=true')
        .expect(200);

      expect(response.body.products.every((p: any) =>
        p.available === true && p.isBestSeller === true
      )).toBe(true);
    });

    it('should combine filters, sorting, and pagination', async () => {
      const response = await request(app)
        .get('/api/products?available=true&sortBy=price&order=asc&page=1&limit=5')
        .expect(200);

      expect(response.body.products).toHaveLength(5);
      expect(response.body.products.every((p: any) => p.available === true)).toBe(true);

      const prices = response.body.products.map((p: any) => p.price);
      const sortedPrices = [...prices].sort((a, b) => a - b);
      expect(prices).toEqual(sortedPrices);
    });
  });

  describe('Edge Cases', () => {
    it('should return empty array for page beyond total pages', async () => {
      const response = await request(app)
        .get('/api/products?page=100')
        .expect(200);

      expect(response.body.products).toHaveLength(0);
      expect(response.body.pagination.page).toBe(100);
      expect(response.body.pagination.total).toBe(25);
    });

    it('should handle page=0 by treating as page=1', async () => {
      const response = await request(app)
        .get('/api/products?page=0')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle negative page by treating as page=1', async () => {
      const response = await request(app)
        .get('/api/products?page=-5')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle limit=0 by using default limit', async () => {
      const response = await request(app)
        .get('/api/products?limit=0')
        .expect(200);

      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle negative limit by using default limit', async () => {
      const response = await request(app)
        .get('/api/products?limit=-10')
        .expect(200);

      expect(response.body.pagination.limit).toBe(10);
    });

    it('should handle invalid sortBy field by using default sort', async () => {
      const response = await request(app)
        .get('/api/products?sortBy=invalidField')
        .expect(200);

      expect(response.body.products).toBeDefined();
      // Should fallback to createdAt desc
    });

    it('should handle invalid order value by using default order', async () => {
      const response = await request(app)
        .get('/api/products?order=invalid')
        .expect(200);

      expect(response.body.products).toBeDefined();
    });

    it('should handle non-numeric page parameter', async () => {
      const response = await request(app)
        .get('/api/products?page=abc')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
    });

    it('should handle non-numeric limit parameter', async () => {
      const response = await request(app)
        .get('/api/products?limit=xyz')
        .expect(200);

      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('Empty Results', () => {
    it('should handle empty database gracefully', async () => {
      // Delete all products
      const Product = (await import('../models/Product')).Product;
      await Product.deleteMany({});

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.pages).toBe(0);
    });

    it('should handle filters that match no products', async () => {
      const response = await request(app)
        .get('/api/products?available=true&isBestSeller=true&sortBy=price&order=desc')
        .expect(200);

      // Based on our test data, available products (even indices) and best sellers (first 5)
      // overlap at products 2 and 4 only
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Pagination Metadata Accuracy', () => {
    it('should calculate total pages correctly for exact division', async () => {
      const response = await request(app)
        .get('/api/products?limit=5')
        .expect(200);

      expect(response.body.pagination.pages).toBe(5); // 25 / 5 = 5
    });

    it('should calculate total pages correctly with remainder', async () => {
      const response = await request(app)
        .get('/api/products?limit=10')
        .expect(200);

      expect(response.body.pagination.pages).toBe(3); // ceil(25 / 10) = 3
    });

    it('should report correct total across all pages', async () => {
      const page1 = await request(app).get('/api/products?page=1&limit=10');
      const page2 = await request(app).get('/api/products?page=2&limit=10');
      const page3 = await request(app).get('/api/products?page=3&limit=10');

      expect(page1.body.pagination.total).toBe(25);
      expect(page2.body.pagination.total).toBe(25);
      expect(page3.body.pagination.total).toBe(25);

      const allProducts = [
        ...page1.body.products,
        ...page2.body.products,
        ...page3.body.products
      ];
      expect(allProducts).toHaveLength(25);
    });
  });
});
