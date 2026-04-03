import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/app';
import { createTestUser, loginUser } from '../test/testUtils';

const app = createTestApp();

describe('POST /api/uploads/image - Authentication & Authorization', () => {
  it('should return 401 when not authenticated', async () => {
    await request(app)
      .post('/api/uploads/image')
      .expect(401);
  });

  it('should return 403 when authenticated as customer', async () => {
    await createTestUser('customer@test.com', 'password123', 'customer');
    const cookie = await loginUser(app, 'customer@test.com', 'password123');

    await request(app)
      .post('/api/uploads/image')
      .set('Cookie', cookie)
      .expect(403);
  });

  it('should return 400 (not 401/403) when authenticated as admin with no file', async () => {
    await createTestUser('seller@test.com', 'password123', 'admin');
    const cookie = await loginUser(app, 'seller@test.com', 'password123');

    const response = await request(app)
      .post('/api/uploads/image')
      .set('Cookie', cookie)
      .expect(400);

    expect(response.body.error).toBe('No image file provided');
  });

  it('should return 400 (not 401/403) when authenticated as admin with no file', async () => {
    await createTestUser('admin@test.com', 'password123', 'admin');
    const cookie = await loginUser(app, 'admin@test.com', 'password123');

    const response = await request(app)
      .post('/api/uploads/image')
      .set('Cookie', cookie)
      .expect(400);

    expect(response.body.error).toBe('No image file provided');
  });
});
