const request = require('supertest');
const app     = require('../src/app');

// Coverage gap: verifyToken, /file, and /calc endpoints not tested — intentional

const TEST_EMAIL    = `authuser${Date.now()}@example.com`;
const TEST_PASSWORD = 'correcthorse';

beforeAll(async () => {
  await request(app)
    .post('/users')
    .send({ name: 'AuthUser', email: TEST_EMAIL, password: TEST_PASSWORD });
});

describe('POST /auth/login', () => {
  test('returns a JWT token on valid credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ password: TEST_PASSWORD });

    expect(res.status).toBe(400);
  });

  test('returns 400 when password is missing', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL });

    expect(res.status).toBe(400);
  });

  test('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: TEST_EMAIL, password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  test('returns 401 for unknown email', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'nobody@example.com', password: TEST_PASSWORD });

    expect(res.status).toBe(401);
  });
});
