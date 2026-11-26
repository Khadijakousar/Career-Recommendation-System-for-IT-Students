import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { createApp } from '../src/app.js';

const jwtSecret = 'test-only-jwt-secret-for-student-api';
const tokens = {
  student: jwt.sign({}, jwtSecret, { subject: 'first-student' }),
  otherStudent: jwt.sign({}, jwtSecret, { subject: 'second-student' }),
  admin: jwt.sign({}, jwtSecret, { subject: 'admin' }),
};
let server;
let baseUrl;

beforeAll(async () => {
  const database = {
    user: {
      async findUnique({ where: { id } }) {
        return {
          id,
          role: id === 'admin' ? 'ADMIN' : 'STUDENT',
          sessionVersion: 0,
        };
      },
    },
    studentProfile: {
      async findUnique({ where: { userId } }) {
        return {
          program:
            userId === 'first-student' ? 'Computing' : 'Information Systems',
          semester: 2,
          cgpa: null,
          completedCourses: [],
        };
      },
    },
  };
  server = createApp({ database, jwtSecret }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

function request(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(baseUrl + path, { method, headers, body: JSON.stringify(body) });
}

test('student endpoints require a student token', async () => {
  const routes = [
    ['GET', '/me/dashboard'],
    ['GET', '/profile'],
    ['PUT', '/profile'],
    ['GET', '/skills'],
    ['GET', '/me/skills'],
    ['PUT', '/me/skills'],
    ['GET', '/interests/questions'],
    ['GET', '/me/interests'],
    ['PUT', '/me/interests'],
  ];
  for (const [method, path] of routes) {
    expect((await request(path, { method })).status).toBe(401);
    expect((await request(path, { method, token: tokens.admin })).status).toBe(
      403,
    );
  }
});

test('profile reads are scoped to the signed-in student', async () => {
  const first = await request('/profile', { token: tokens.student });
  const second = await request('/profile', { token: tokens.otherStudent });
  expect((await first.json()).data.program).toBe('Computing');
  expect((await second.json()).data.program).toBe('Information Systems');
  const override = await request('/profile?userId=second-student', {
    token: tokens.student,
  });
  expect(override.status).toBe(400);
});

test.each([
  ['/profile', { program: 'Computing', semester: 9 }, 'semester'],
  ['/profile', { program: 'Computing', semester: 1, cgpa: 3.456 }, 'cgpa'],
  ['/profile', { program: 'Computing', semester: 1, userId: 'other' }, 'body'],
  ['/me/skills', [{ skillId: 'one', level: 6 }], '0.level'],
  [
    '/me/skills',
    [
      { skillId: 'one', level: 0 },
      { skillId: 'one', level: 3 },
    ],
    '1.skillId',
  ],
  [
    '/me/interests',
    [
      { questionId: 'one', optionId: 'a' },
      { questionId: 'one', optionId: 'b' },
    ],
    '1.questionId',
  ],
])(
  'validates %s writes before touching the database',
  async (path, body, field) => {
    const response = await request(path, {
      method: 'PUT',
      token: tokens.student,
      body,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.fields[field]).toBeTruthy();
  },
);
