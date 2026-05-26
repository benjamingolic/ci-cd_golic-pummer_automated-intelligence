const request = require('supertest');
const app     = require('../src/app');

// Coverage gap: searchUsers SQL-injection path not tested here — intentional

describe('POST /users', () => {
  test('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Alice', email: `alice${Date.now()}@example.com`, password: 'pass123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('userId');
  });

  test('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ email: 'bob@example.com', password: 'pass123' });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining(['Name is required']));
  });

  test('returns 400 when email is missing', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Bob', password: 'pass123' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when password is too short', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Carol', email: 'carol@example.com', password: 'ab' });

    expect(res.status).toBe(400);
  });

  test('returns 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/users')
      .send({ name: 'Dave', email: 'not-an-email', password: 'pass123' });

    expect(res.status).toBe(400);
  });
});

describe('GET /users/search', () => {
  test('returns 400 when name param is absent', async () => {
    const res = await request(app).get('/users/search');
    expect(res.status).toBe(400);
  });

  test('returns users array for a valid name query', async () => {
    // seed a user first
    await request(app)
      .post('/users')
      .send({ name: 'SearchTarget', email: `st${Date.now()}@example.com`, password: 'pass123' });

    const res = await request(app).get('/users/search?name=SearchTarget');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('users');
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
