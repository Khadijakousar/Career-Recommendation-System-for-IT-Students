import { once } from 'node:events';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { createApp } from '../src/app.js';
import { authenticate, requireRole } from '../src/middleware/auth.js';
import { errorHandler } from '../src/middleware/errorHandler.js';
import { createAuthService } from '../src/modules/auth/auth.service.js';

const jwtSecret = 'test-only-jwt-secret-for-auth-api';
const student = {
  name: 'Aisha Khan',
  email: 'aisha@example.test',
  password: 'correct password',
  confirmPassword: 'correct password',
};
let accounts;
let server;
let baseUrl;

function selectFields(account, fields) {
  if (!account) return null;
  return Object.fromEntries(
    Object.keys(fields).map((field) => [field, account[field]]),
  );
}

beforeEach(async () => {
  accounts = new Map();
  const database = {
    user: {
      async create({ data, select }) {
        if (accounts.has(data.email)) {
          throw Object.assign(new Error('Unique constraint failed'), {
            code: 'P2002',
          });
        }
        const account = { ...data, id: String(accounts.size + 1) };
        accounts.set(account.email, account);
        return selectFields(account, select);
      },
      async findUnique({ where, select }) {
        const account = where.email
          ? accounts.get(where.email)
          : [...accounts.values()].find(({ id }) => id === where.id);
        return selectFields(account, select);
      },
    },
  };
  const service = createAuthService({ database, jwtSecret });
  const app = express();
  app.get(
    '/test/admin',
    authenticate({ jwtSecret, getUser: service.getUser }),
    requireRole('ADMIN'),
    (_request, response) => response.sendStatus(204),
  );
  app.use(
    createApp({
      clientUrl: 'http://localhost:5173',
      checkDatabase: async () => {},
      database,
      jwtSecret,
    }),
  );
  app.use(errorHandler);
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterEach(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

function request(path, { body, token } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${baseUrl}${path}`, {
    method: body ? 'POST' : 'GET',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function register(body = student) {
  return request('/api/auth/register', { body });
}

function login(email = student.email, password = student.password) {
  return request('/api/auth/login', { body: { email, password } });
}

test('signup creates a student with a bcrypt hash and returns only public account data', async () => {
  const response = await register({
    ...student,
    email: ` ${student.email.toUpperCase()} `,
  });
  const user = {
    id: '1',
    name: student.name,
    email: student.email,
    role: 'STUDENT',
  };

  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ data: { user } });
  const { passwordHash } = accounts.get(student.email);
  expect(bcrypt.getRounds(passwordHash)).toBe(10);
  expect(await bcrypt.compare(student.password, passwordHash)).toBe(true);
});

test.each([
  [
    'weak password',
    { password: 'short', confirmPassword: 'short' },
    'password',
  ],
  [
    'mismatched confirmation',
    { confirmPassword: 'different password' },
    'confirmPassword',
  ],
  [
    'password past the bcrypt byte limit',
    { password: '🙂'.repeat(19), confirmPassword: '🙂'.repeat(19) },
    'password',
  ],
  ['invalid email', { email: 'not-an-email' }, 'email'],
  ['submitted admin role', { role: 'ADMIN' }, 'body'],
])('signup rejects %s', async (_label, changes, field) => {
  const response = await register({ ...student, ...changes });

  expect(response.status).toBe(400);
  expect((await response.json()).error.fields[field]).toBeTruthy();
  expect(accounts.size).toBe(0);
});

test('signup reports duplicate email as a conflict', async () => {
  expect((await register()).status).toBe(201);
  const response = await register({
    ...student,
    email: student.email.toUpperCase(),
  });

  expect(response.status).toBe(409);
  expect((await response.json()).error.fields.email).toBeTruthy();
  expect(accounts.size).toBe(1);
});

test('login issues a seven-day token and the current-user endpoint returns the public account', async () => {
  await register();
  const response = await login();
  const { data } = await response.json();
  const claims = jwt.verify(data.token, jwtSecret, { algorithms: ['HS256'] });

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(claims.sub).toBe(data.user.id);
  expect(claims.exp - claims.iat).toBe(7 * 24 * 60 * 60);

  const me = await request('/api/auth/me', { token: data.token });
  expect(me.status).toBe(200);
  expect(await me.json()).toEqual({ data: { user: data.user } });
  expect(data.user).not.toHaveProperty('passwordHash');
});

test('login gives the same error for unknown email and wrong password', async () => {
  await register();
  const responses = await Promise.all([
    login('unknown@example.test'),
    login(student.email, 'the wrong password'),
  ]);

  for (const response of responses) {
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      error: { message: 'Invalid email or password' },
    });
  }
});

test('the current-user endpoint rejects missing, invalid, and expired tokens', async () => {
  const expired = jwt.sign({}, jwtSecret, { subject: '1', expiresIn: -1 });

  for (const token of [undefined, 'invalid-token', expired]) {
    expect((await request('/api/auth/me', { token })).status).toBe(401);
  }
});

test('role middleware allows an admin and denies a student', async () => {
  await register();
  const adminEmail = 'admin@example.test';
  accounts.set(adminEmail, {
    id: '2',
    name: 'Test admin',
    email: adminEmail,
    role: 'ADMIN',
    passwordHash: await bcrypt.hash(student.password, 10),
  });

  const studentSession = (await (await login()).json()).data;
  const adminSession = (await (await login(adminEmail)).json()).data;
  expect(adminSession.user.role).toBe('ADMIN');
  expect(
    (await request('/test/admin', { token: studentSession.token })).status,
  ).toBe(403);
  expect(
    (await request('/test/admin', { token: adminSession.token })).status,
  ).toBe(204);
});

test('auth endpoints rate-limit repeated requests', async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    expect((await login('invalid-email')).status).toBe(400);
  }
  const response = await register();
  expect(response.status).toBe(429);
  expect(response.headers.has('retry-after')).toBe(true);
});

test('authentication limits stay separate for clients behind a trusted proxy', async () => {
  const proxiedServer = createApp({ trustProxyHops: 1 }).listen(0, '127.0.0.1');
  await once(proxiedServer, 'listening');
  const authUrl = `http://127.0.0.1:${proxiedServer.address().port}/api/auth`;

  function attempt(path, clientIp) {
    return fetch(`${authUrl}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp,
      },
      body: '{}',
    });
  }

  try {
    const firstClient = '192.0.2.1';
    const secondClient = '192.0.2.2';
    for (let count = 0; count < 20; count += 1) {
      const endpoint = count % 2 === 0 ? 'login' : 'register';
      const response = await attempt(endpoint, firstClient);
      expect(response.status).toBe(400);
      await response.body.cancel();
    }

    const blocked = await attempt('login', firstClient);
    expect(blocked.status).toBe(429);
    await blocked.body.cancel();

    const allowed = await attempt('login', secondClient);
    expect(allowed.status).toBe(400);
    expect(allowed.headers.get('ratelimit')).toContain('r=19');
    expect(allowed.headers.get('ratelimit-policy')).not.toBe(
      blocked.headers.get('ratelimit-policy'),
    );
    await allowed.body.cancel();
  } finally {
    await new Promise((resolve) => proxiedServer.close(resolve));
  }
});
