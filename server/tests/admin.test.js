import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { createApp } from '../src/app.js';

const secret = 'test-only-jwt-secret-for-admin-api';
const studentToken = jwt.sign({}, secret, { subject: 'STUDENT' });
const adminToken = jwt.sign({}, secret, { subject: 'ADMIN' });
let server;
let baseUrl;

beforeAll(async () => {
  const database = {
    user: {
      async findUnique({ where: { id } }) {
        return { id, role: id };
      },
    },
  };
  server = createApp({ database, jwtSecret: secret }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}/api/admin`;
});

afterAll(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

function request(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body) headers['Content-Type'] = 'application/json';
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

test('students receive 403 from every admin endpoint and unauthenticated users receive 401', async () => {
  const collections = [
    'careers',
    'skills',
    'interest-areas',
    'interest-questions',
    'resources',
  ];
  const routes = collections.flatMap((collection) => [
    ['GET', `/${collection}`],
    ['POST', `/${collection}`],
    ['GET', `/${collection}/test-id`],
    ['PUT', `/${collection}/test-id`],
    ['DELETE', `/${collection}/test-id`],
  ]);
  routes.push(['GET', '/stats'], ['PUT', '/careers/test-id/skills']);

  for (const [method, path] of routes) {
    const response = await request(path, { method, token: studentToken });
    expect(response.status, `${method} ${path}`).toBe(403);
    await response.json();
  }
  expect((await request('/skills')).status).toBe(401);
});

test('admin validation rejects invalid pagination, resource URLs and duplicate skill requirements', async () => {
  const badPage = await request('/skills?page=0', { token: adminToken });
  expect(badPage.status).toBe(400);
  expect((await badPage.json()).error.fields).toHaveProperty('page');

  const badResource = await request('/resources', {
    token: adminToken,
    method: 'POST',
    body: {
      skillId: 'skill-1',
      title: 'Unsafe link',
      url: 'file:///tmp/example',
      type: 'DOCS',
      isFree: true,
    },
  });
  expect(badResource.status).toBe(400);
  expect((await badResource.json()).error.fields).toHaveProperty('url');

  const requirement = { skillId: 'skill-1', requiredLevel: 3, weight: 4 };
  const duplicate = await request('/careers/test-id/skills', {
    token: adminToken,
    method: 'PUT',
    body: [requirement, requirement],
  });
  expect(duplicate.status).toBe(400);
  expect((await duplicate.json()).error.fields['1.skillId']).toBeTruthy();
});
