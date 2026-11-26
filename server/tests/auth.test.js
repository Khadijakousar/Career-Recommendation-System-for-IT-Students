import { once } from 'node:events';
import bcrypt from 'bcrypt';
import express from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
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
let messages;

function selectFields(account, fields) {
  if (!account) return null;
  if (!fields) return { ...account };
  return Object.fromEntries(
    Object.keys(fields).map((field) => [field, account[field]]),
  );
}

function matches(record, where) {
  return Object.entries(where).every(([field, condition]) => {
    const value = record[field] ?? null;
    if (field === 'OR')
      return condition.some((clause) => matches(record, clause));
    if (condition?.gt) return value !== null && value > condition.gt;
    if (condition?.lte) return value !== null && value <= condition.lte;
    if (condition?.not === null) return value !== null;
    return value === condition;
  });
}

beforeEach(async () => {
  accounts = new Map();
  messages = new Map();
  const verificationLinks = new Map();
  const database = {
    user: {
      async create({ data, select }) {
        if (accounts.has(data.email)) {
          throw Object.assign(new Error('Unique constraint failed'), {
            code: 'P2002',
          });
        }
        const account = {
          ...data,
          id: String(accounts.size + 1),
          sessionVersion: 0,
        };
        accounts.set(account.email, account);
        return selectFields(account, select);
      },
      async findUnique({ where, select }) {
        const account = [...accounts.values()].find((record) =>
          matches(record, where),
        );
        return selectFields(account, select);
      },
      async updateMany({ where, data }) {
        const account = [...accounts.values()].find((record) =>
          matches(record, where),
        );
        if (!account) return { count: 0 };
        const { sessionVersion, ...fields } = data;
        Object.assign(account, fields);
        if (sessionVersion) account.sessionVersion += sessionVersion.increment;
        return { count: 1 };
      },
    },
    emailVerification: {
      async createMany({ data }) {
        if (verificationLinks.has(data.email)) return { count: 0 };
        verificationLinks.set(data.email, data);
        return { count: 1 };
      },
      async updateMany({ where, data }) {
        const record = verificationLinks.get(where.email);
        if (!record || !matches(record, where)) return { count: 0 };
        verificationLinks.set(data.email, data);
        return { count: 1 };
      },
      async findUnique({ where }) {
        return [...verificationLinks.values()].find((record) =>
          matches(record, where),
        );
      },
      async deleteMany({ where }) {
        const record = [...verificationLinks.values()].find((entry) =>
          matches(entry, where),
        );
        return {
          count: Number(
            record ? verificationLinks.delete(record.email) : false,
          ),
        };
      },
    },
    async $transaction(callback) {
      return callback(database);
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
      sendAccountEmail: async (email, token, purpose) =>
        messages.set(email, { token, purpose }),
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

function request(path, { body, token, method = body ? 'POST' : 'GET' } = {}) {
  const headers = {};
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

function requestSignup(email = student.email) {
  return request('/api/auth/register', { body: { email } });
}

async function emailToken(email, purpose) {
  await vi.waitFor(() => expect(messages.get(email)?.purpose).toBe(purpose));
  return messages.get(email).token;
}

async function register({ name, email, password, confirmPassword } = student) {
  const response = await requestSignup(email);
  if (response.status !== 202) return response;
  const token = await emailToken(email.trim().toLowerCase(), 'signup');
  return request('/api/auth/complete-signup', {
    body: { token, name, newPassword: password, confirmPassword },
  });
}

function login(email = student.email, password = student.password) {
  return request('/api/auth/login', { body: { email, password } });
}

test('signup creates a verified student only after a single-use email link and password', async () => {
  expect((await requestSignup(` ${student.email.toUpperCase()} `)).status).toBe(
    202,
  );
  const token = await emailToken(student.email, 'signup');
  expect(accounts.size).toBe(0);
  expect((await login()).status).toBe(401);
  const body = {
    token,
    name: student.name,
    newPassword: student.password,
    confirmPassword: student.password,
  };
  expect((await request('/api/auth/complete-signup', { body })).status).toBe(
    204,
  );
  expect((await request('/api/auth/complete-signup', { body })).status).toBe(
    400,
  );
  const { passwordHash, role, emailVerifiedAt } = accounts.get(student.email);
  expect(role).toBe('STUDENT');
  expect(emailVerifiedAt).toBeInstanceOf(Date);
  expect(bcrypt.getRounds(passwordHash)).toBe(10);
  expect(await bcrypt.compare(student.password, passwordHash)).toBe(true);
});

test.each([
  [
    'weak password',
    { password: 'short', confirmPassword: 'short' },
    'newPassword',
  ],
  [
    'mismatched confirmation',
    { confirmPassword: 'different password' },
    'confirmPassword',
  ],
  [
    'password past the bcrypt byte limit',
    { password: '🙂'.repeat(19), confirmPassword: '🙂'.repeat(19) },
    'newPassword',
  ],
  ['submitted admin role', { role: 'ADMIN' }, 'body'],
])('signup rejects %s', async (_label, changes, field) => {
  await requestSignup();
  const token = await emailToken(student.email, 'signup');
  const { password = student.password, ...fields } = changes;
  const response = await request('/api/auth/complete-signup', {
    body: {
      token,
      name: student.name,
      newPassword: password,
      confirmPassword: student.password,
      ...fields,
    },
  });

  expect(response.status).toBe(400);
  expect((await response.json()).error.fields[field]).toBeTruthy();
  expect(accounts.size).toBe(0);
});

test('signup responds identically for existing addresses and rejects malformed email', async () => {
  expect((await requestSignup('not-an-email')).status).toBe(400);
  expect((await register()).status).toBe(204);
  const original = messages.get(student.email);
  const duplicate = await requestSignup(student.email.toUpperCase());
  const fresh = await requestSignup('fresh@example.test');
  expect(duplicate.status).toBe(202);
  expect(fresh.status).toBe(202);
  expect(await duplicate.json()).toEqual(await fresh.json());
  await emailToken('fresh@example.test', 'signup');
  expect(messages.get(student.email)).toBe(original);
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
  expect(claims.sessionVersion).toBe(0);
  expect(claims.exp - claims.iat).toBe(7 * 24 * 60 * 60);

  const me = await request('/api/auth/me', { token: data.token });
  expect(me.status).toBe(200);
  expect(await me.json()).toEqual({ data: { user: data.user } });
  expect(data.user).not.toHaveProperty('passwordHash');
  expect(data.user).not.toHaveProperty('sessionVersion');
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

test('existing accounts keep sign-in access and enable recovery only after email and password confirmation', async () => {
  accounts.set(student.email, {
    id: '1',
    name: student.name,
    email: student.email,
    role: 'STUDENT',
    emailVerifiedAt: null,
    sessionVersion: 0,
    passwordHash: await bcrypt.hash(student.password, 10),
  });
  const { data: session } = await (await login()).json();
  const body = { email: student.email };
  expect((await request('/api/auth/forgot-password', { body })).status).toBe(
    202,
  );
  expect(messages.has(student.email)).toBe(false);
  expect(
    (await request('/api/auth/email-verification', { method: 'POST' })).status,
  ).toBe(401);
  expect(
    (
      await request('/api/auth/email-verification', {
        method: 'POST',
        token: session.token,
      })
    ).status,
  ).toBe(202);
  const token = await emailToken(student.email, 'verify');
  expect(
    (
      await request('/api/auth/verify-email', {
        body: { token, password: 'incorrect' },
      })
    ).status,
  ).toBe(400);
  expect(
    (
      await request('/api/auth/verify-email', {
        body: { token, password: student.password },
      })
    ).status,
  ).toBe(204);
  expect(
    (
      await request('/api/auth/verify-email', {
        body: { token, password: student.password },
      })
    ).status,
  ).toBe(400);
  const me = await request('/api/auth/me', { token: session.token });
  expect((await me.json()).data.user.emailVerifiedAt).toBeTruthy();
  expect((await request('/api/auth/forgot-password', { body })).status).toBe(
    202,
  );
  expect(await emailToken(student.email, 'reset')).not.toBe(token);
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
    sessionVersion: 0,
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

const passwordChange = {
  currentPassword: student.password,
  newPassword: 'a different password',
  confirmPassword: 'a different password',
};

function changePassword(token, body = passwordChange) {
  return request('/api/auth/password', { method: 'PUT', token, body });
}

test('changing a password revokes the account’s current and legacy sessions', async () => {
  await register();
  const { data: session } = await (await login()).json();
  const legacy = jwt.sign({}, jwtSecret, { subject: session.user.id });
  expect((await request('/api/auth/me', { token: legacy })).status).toBe(200);

  expect((await changePassword()).status).toBe(401);
  const changed = await changePassword(session.token);
  expect(changed.status).toBe(204);
  expect(await changed.text()).toBe('');
  for (const token of [session.token, legacy]) {
    expect((await request('/api/auth/me', { token })).status).toBe(401);
    expect((await request('/api/me/dashboard', { token })).status).toBe(401);
  }
  expect((await login()).status).toBe(401);
  const response = await login(student.email, passwordChange.newPassword);
  expect(response.status).toBe(200);
  const { data } = await response.json();
  expect((await request('/api/auth/me', { token: data.token })).status).toBe(
    200,
  );
});

test.each([
  [{ currentPassword: 'incorrect password' }, 'currentPassword'],
  [{ newPassword: 'short', confirmPassword: 'short' }, 'newPassword'],
  [{ confirmPassword: 'does not match' }, 'confirmPassword'],
  [
    { newPassword: student.password, confirmPassword: student.password },
    'newPassword',
  ],
  [{ userId: 'another-user' }, 'body'],
])(
  'rejects invalid password changes without revoking the session',
  async (changes, field) => {
    await register();
    const { data: session } = await (await login()).json();
    const response = await changePassword(session.token, {
      ...passwordChange,
      ...changes,
    });
    expect(response.status).toBe(400);
    expect((await response.json()).error.fields[field]).toBeTruthy();
    expect(
      (await request('/api/auth/me', { token: session.token })).status,
    ).toBe(200);
    expect((await login()).status).toBe(200);
  },
);

test('only one concurrent password change can use the same session', async () => {
  await register();
  const { data: session } = await (await login()).json();
  const secondPassword = 'another valid password';
  const [first, second] = await Promise.all([
    changePassword(session.token),
    changePassword(session.token, {
      ...passwordChange,
      newPassword: secondPassword,
      confirmPassword: secondPassword,
    }),
  ]);
  expect([first.status, second.status].sort()).toEqual([204, 401]);
  const winningPassword =
    first.status === 204 ? passwordChange.newPassword : secondPassword;
  expect((await login(student.email, winningPassword)).status).toBe(200);
});

test('password change limits are separate for signed-in accounts', async () => {
  await register();
  const otherEmail = 'other@example.test';
  await register({ ...student, email: otherEmail });
  const { data: session } = await (await login()).json();
  const { data: otherSession } = await (await login(otherEmail)).json();

  for (let attempt = 0; attempt < 10; attempt += 1) {
    expect((await changePassword(session.token, {})).status).toBe(400);
  }
  expect((await changePassword(session.token, {})).status).toBe(429);
  expect((await changePassword(otherSession.token, {})).status).toBe(400);
});

test('auth endpoints rate-limit repeated requests', async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    expect((await login('invalid-email')).status).toBe(400);
  }
  const response = await requestSignup();
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
