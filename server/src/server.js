import { createApp } from './app.js';
import { createDatabase } from './config/database.js';

const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const proxyHops = process.env.TRUST_PROXY_HOPS ?? '0';
const trustProxyHops = Number(proxyHops);

if (!databaseUrl) {
  throw new Error('Set DATABASE_URL before starting the API.');
}

if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error(
    'Set JWT_SECRET to at least 32 bytes before starting the API.',
  );
}
if (!/^\d+$/.test(proxyHops) || !Number.isSafeInteger(trustProxyHops)) {
  throw new Error('Set TRUST_PROXY_HOPS to a non-negative integer.');
}
if (process.env.RENDER === 'true' && trustProxyHops === 0) {
  console.warn(
    'TRUST_PROXY_HOPS is 0 on Render. Authentication clients may share a rate limit until the verified proxy hop count is configured.',
  );
}

const database = createDatabase(databaseUrl);
const app = createApp({
  clientUrl,
  database,
  jwtSecret,
  trustProxyHops,
  checkDatabase: () => database.$queryRaw`SELECT 1`,
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
