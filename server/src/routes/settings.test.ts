import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp } from '../test/app';
import { createTestUser, loginUser } from '../test/testUtils';

const app = createTestApp();

describe('GET /api/settings/business', () => {
  it('is publicly accessible without authentication', async () => {
    const res = await request(app)
      .get('/api/settings/business')
      .expect(200);

    expect(res.body).toBeDefined();
  });
});

describe('PUT /api/settings/business — access control', () => {
  it('returns 401 when unauthenticated', async () => {
    await request(app)
      .put('/api/settings/business')
      .send({ phoneNumber: '09123456789' })
      .expect(401);
  });

  it('returns 403 for customer role', async () => {
    await createTestUser('customer@test.com', 'Password1!test', 'customer');
    const cookie = await loginUser(app, 'customer@test.com', 'Password1!test');

    await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ phoneNumber: '09123456789' })
      .expect(403);
  });

  it('returns 200 for admin role with valid data', async () => {
    await createTestUser('seller@test.com', 'Password1!test', 'admin');
    const cookie = await loginUser(app, 'seller@test.com', 'Password1!test');

    const res = await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ phoneNumber: '09123456789', bankName: 'KBZ Bank' })
      .expect(200);

    expect(res.body.phoneNumber).toBe('09123456789');
    expect(res.body.bankName).toBe('KBZ Bank');
  });
});

describe('PUT /api/settings/business — phone/KBZ validation', () => {
  let cookie: string;

  beforeEach(async () => {
    await createTestUser('seller2@test.com', 'Password1!test', 'admin');
    cookie = await loginUser(app, 'seller2@test.com', 'Password1!test');
  });

  const invalidPhones = ['abc', '123', 'not-a-phone', '+1234567890', '12345678901234'];

  for (const phone of invalidPhones) {
    it(`rejects invalid phoneNumber: "${phone}"`, async () => {
      const res = await request(app)
        .put('/api/settings/business')
        .set('Cookie', cookie)
        .send({ phoneNumber: phone })
        .expect(400);
      expect(res.body.error).toBeTruthy();
    });
  }

  const validPhones = [
    '09123456789',
    '0912345678',
    '+959123456789',
    '+9509123456789',
    '01234567',
  ];

  for (const phone of validPhones) {
    it(`accepts valid Myanmar phoneNumber: "${phone}"`, async () => {
      await request(app)
        .put('/api/settings/business')
        .set('Cookie', cookie)
        .send({ phoneNumber: phone })
        .expect(200);
    });
  }

  it('accepts empty string to clear a phone number', async () => {
    await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ phoneNumber: '' })
      .expect(200);
  });

  it('rejects invalid kbzPayNumber', async () => {
    const res = await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ kbzPayNumber: 'not-a-number' })
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects invalid viberNumber', async () => {
    const res = await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ viberNumber: 'abc123' })
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects invalid contactEmail', async () => {
    const res = await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ contactEmail: 'not-an-email' })
      .expect(400);
    expect(res.body.error).toBeTruthy();
  });

  it('accepts valid contactEmail', async () => {
    await request(app)
      .put('/api/settings/business')
      .set('Cookie', cookie)
      .send({ contactEmail: 'shop@example.com' })
      .expect(200);
  });
});
