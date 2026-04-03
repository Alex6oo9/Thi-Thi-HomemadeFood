import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/app';
import { createTestUser, createTestProduct } from '../test/testUtils';

const app = createTestApp();

describe('GET /api/products - Search Functionality', () => {
  let sellerId: string;

  beforeEach(async () => {
    // Create a seller user
    const seller = await createTestUser('seller@test.com', 'password123', 'admin');
    sellerId = seller._id.toString();

    // Create diverse test products for search testing
    await createTestProduct(sellerId, { name: 'Mohinga', price: 5000 });
    await createTestProduct(sellerId, { name: 'Shan Noodles', price: 3000 });
    await createTestProduct(sellerId, { name: 'Burmese Mohinga Soup', price: 5500 });
    await createTestProduct(sellerId, { name: 'Tea Leaf Salad', price: 4000 });
    await createTestProduct(sellerId, { name: 'Coconut Noodles', price: 3500 });
    await createTestProduct(sellerId, { name: 'Mandalay Mohinga', price: 6000 });
    await createTestProduct(sellerId, { name: 'Shan Style Rice', price: 4500 });
    await createTestProduct(sellerId, { name: 'Mont Lin Maya', price: 2000 });
  });

  describe('Basic Search', () => {
    it('should return products matching search query', async () => {
      const response = await request(app)
        .get('/api/products?search=mohinga')
        .expect(200);

      expect(response.body.products).toBeDefined();
      expect(response.body.pagination).toBeDefined();
      expect(response.body.products.length).toBe(3); // Mohinga, Burmese Mohinga Soup, Mandalay Mohinga
    });

    it('should return case-insensitive results', async () => {
      const responses = await Promise.all([
        request(app).get('/api/products?search=MOHINGA'),
        request(app).get('/api/products?search=mohinga'),
        request(app).get('/api/products?search=MoHiNgA'),
      ]);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.products.length).toBe(3);
      });
    });

    it('should match partial strings (prefix)', async () => {
      const response = await request(app)
        .get('/api/products?search=moh')
        .expect(200);

      expect(response.body.products.length).toBe(3);
      expect(response.body.products.every((p: any) =>
        p.name.toLowerCase().includes('moh')
      )).toBe(true);
    });

    it('should match partial strings (infix)', async () => {
      const response = await request(app)
        .get('/api/products?search=noodle')
        .expect(200);

      expect(response.body.products.length).toBe(2); // Shan Noodles, Coconut Noodles
      expect(response.body.products.every((p: any) =>
        p.name.toLowerCase().includes('noodle')
      )).toBe(true);
    });

    it('should match partial strings (suffix)', async () => {
      const response = await request(app)
        .get('/api/products?search=salad')
        .expect(200);

      expect(response.body.products.length).toBe(1); // Tea Leaf Salad
      expect(response.body.products[0].name).toBe('Tea Leaf Salad');
    });
  });

  describe('Search with Pagination', () => {
    it('should paginate search results', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&limit=2')
        .expect(200);

      expect(response.body.products).toHaveLength(2);
      expect(response.body.pagination.total).toBe(3);
      expect(response.body.pagination.pages).toBe(2);
    });

    it('should navigate to second page of search results', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&page=2&limit=2')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.pagination.page).toBe(2);
    });

    it('should return empty array for page beyond results', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&page=10')
        .expect(200);

      expect(response.body.products).toHaveLength(0);
      expect(response.body.pagination.page).toBe(10);
    });
  });

  describe('Search with Sorting', () => {
    it('should sort search results by name ascending', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&sortBy=name&order=asc')
        .expect(200);

      const names = response.body.products.map((p: any) => p.name);
      const sortedNames = [...names].sort();
      expect(names).toEqual(sortedNames);
    });

    it('should sort search results by price descending', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&sortBy=price&order=desc')
        .expect(200);

      const prices = response.body.products.map((p: any) => p.price);
      expect(prices[0]).toBe(6000); // Mandalay Mohinga
      expect(prices[prices.length - 1]).toBe(5000); // Mohinga
    });
  });

  describe('Search Combined with Filters', () => {
    beforeEach(async () => {
      // Set some products as unavailable
      const Product = (await import('../models/Product')).Product;
      await Product.updateOne(
        { name: 'Burmese Mohinga Soup' },
        { available: false }
      );
    });

    it('should combine search with available filter', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&available=true')
        .expect(200);

      expect(response.body.products.length).toBe(2); // Only available mohinga products
      expect(response.body.products.every((p: any) => p.available === true)).toBe(true);
    });

    it('should combine search with sorting and pagination', async () => {
      const response = await request(app)
        .get('/api/products?search=noodle&sortBy=price&order=asc&page=1&limit=5')
        .expect(200);

      expect(response.body.products.length).toBe(2);
      const prices = response.body.products.map((p: any) => p.price);
      expect(prices[0]).toBeLessThanOrEqual(prices[1]);
    });
  });

  describe('Search Validation', () => {
    it('should reject search query less than 3 characters', async () => {
      const response = await request(app)
        .get('/api/products?search=mo')
        .expect(400);

      expect(response.body.error).toBeDefined();
      expect(response.body.error).toContain('3 and');
    });

    it('should reject 1 character search', async () => {
      const response = await request(app)
        .get('/api/products?search=m')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject 2 character search', async () => {
      const response = await request(app)
        .get('/api/products?search=ab')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should accept exactly 3 characters', async () => {
      const response = await request(app)
        .get('/api/products?search=sha')
        .expect(200);

      expect(response.body.products).toBeDefined();
    });

    it('should reject search query exceeding 100 characters', async () => {
      const longQuery = 'a'.repeat(101);
      const response = await request(app)
        .get(`/api/products?search=${longQuery}`)
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should accept exactly 100 characters', async () => {
      const maxQuery = 'a'.repeat(100);
      const response = await request(app)
        .get(`/api/products?search=${maxQuery}`)
        .expect(200);

      expect(response.body.products).toBeDefined();
    });
  });

  describe('Empty and Special Cases', () => {
    it('should ignore empty search query and return all products', async () => {
      const response = await request(app)
        .get('/api/products?search=')
        .expect(200);

      expect(response.body.products).toHaveLength(8); // All test products
    });

    it('should ignore whitespace-only search query', async () => {
      const response = await request(app)
        .get('/api/products?search=   ')
        .expect(200);

      expect(response.body.products).toHaveLength(8);
    });

    it('should trim whitespace from search query', async () => {
      const response = await request(app)
        .get('/api/products?search=  mohinga  ')
        .expect(200);

      expect(response.body.products.length).toBe(3);
    });

    it('should return empty array when no matches found', async () => {
      const response = await request(app)
        .get('/api/products?search=pizza')
        .expect(200);

      expect(response.body.products).toHaveLength(0);
      expect(response.body.pagination.total).toBe(0);
      expect(response.body.pagination.pages).toBe(0);
    });

    it('should handle special regex characters safely', async () => {
      // Create product with special characters
      await createTestProduct(sellerId, { name: 'Test (Special) Product' });

      const response = await request(app)
        .get('/api/products?search=test (special)')
        .expect(200);

      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Test (Special) Product');
    });

    it('should escape regex special characters', async () => {
      await createTestProduct(sellerId, { name: 'Product $9.99' });

      const response = await request(app)
        .get('/api/products?search=$9.99')
        .expect(200);

      expect(response.body.products.length).toBe(1);
      expect(response.body.products[0].name).toBe('Product $9.99');
    });
  });

  describe('Search Without Query Parameter', () => {
    it('should return all products when search param not provided', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toHaveLength(8);
      expect(response.body.pagination.total).toBe(8);
    });

    it('should work with pagination when no search', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=5')
        .expect(200);

      expect(response.body.products).toHaveLength(5);
      expect(response.body.pagination.total).toBe(8);
    });
  });

  describe('Pagination Metadata with Search', () => {
    it('should return correct pagination metadata for search results', async () => {
      const response = await request(app)
        .get('/api/products?search=moh&limit=2')
        .expect(200);

      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 3,
        pages: 2
      });
    });

    it('should calculate correct total pages for search results', async () => {
      const response = await request(app)
        .get('/api/products?search=noodle&limit=1')
        .expect(200);

      expect(response.body.pagination.pages).toBe(2); // 2 noodle products / 1 per page
    });
  });
});
