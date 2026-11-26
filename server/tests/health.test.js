import { once } from 'node:events';
import { afterEach, expect, test } from 'vitest';
import { createApp } from '../src/app.js';

const clientUrl = 'http://localhost:5173';
let server;

async function requestHealth(checkDatabase) {
  server = createApp({ clientUrl, checkDatabase }).listen(0, '127.0.0.1');
  await once(server, 'listening');

  return fetch(`http://127.0.0.1:${server.address().port}/api/health`, {
    headers: { Origin: clientUrl },
  });
}

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  }
});

test('health responds with OK when the database is reachable', async () => {
  const response = await requestHealth(async () => {});

  expect(response.status).toBe(200);
  expect(response.headers.get('access-control-allow-origin')).toBe(clientUrl);
  expect(await response.json()).toEqual({ data: { status: 'ok' } });
});

test('health returns 503 without exposing database errors', async () => {
  const response = await requestHealth(async () => {
    throw new Error('Private connection details');
  });

  expect(response.status).toBe(503);
  expect(await response.json()).toEqual({
    error: { message: 'Database unavailable' },
  });
});
