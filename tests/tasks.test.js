const request = require('supertest');
const app     = require('../src/app');

// Coverage gap: processRequest deep branching is NOT tested here — intentional

let sharedUserId;

beforeAll(async () => {
  const res = await request(app)
    .post('/users')
    .send({ name: 'TaskOwner', email: `taskowner${Date.now()}@example.com`, password: 'pass123' });
  sharedUserId = res.body.userId;
});

describe('POST /tasks', () => {
  test('creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Write tests', userId: sharedUserId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('taskId');
  });

  test('returns 400 when title is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ userId: sharedUserId });

    expect(res.status).toBe(400);
  });

  test('returns 400 when userId is missing', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'No owner' });

    expect(res.status).toBe(400);
  });

  test('returns 404 when user does not exist', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Ghost task', userId: 999999 });

    expect(res.status).toBe(404);
  });
});

describe('GET /tasks/:id', () => {
  test('returns a task by id', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .send({ title: 'Fetch me', userId: sharedUserId });

    const taskId = createRes.body.taskId;
    const res    = await request(app).get(`/tasks/${taskId}`);

    expect(res.status).toBe(200);
    expect(res.body.task).toHaveProperty('title', 'Fetch me');
  });

  test('returns 404 for a non-existent task', async () => {
    const res = await request(app).get('/tasks/999999');
    expect(res.status).toBe(404);
  });
});
