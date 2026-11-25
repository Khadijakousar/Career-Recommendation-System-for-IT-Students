import { createApp } from './app.js';
import { createDatabase } from './config/database.js';

const port = process.env.PORT || 3000;
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;

if (!databaseUrl) {
  throw new Error('Set DATABASE_URL before starting the API.');
}

if (!jwtSecret || Buffer.byteLength(jwtSecret) < 32) {
  throw new Error(
    'Set JWT_SECRET to at least 32 bytes before starting the API.',
  );
}

const database = createDatabase(databaseUrl);
const app = createApp({
  clientUrl,
  database,
  jwtSecret,
  checkDatabase: () => database.$queryRaw`SELECT 1`,
});

app.listen(port, () => {
  console.log(`API listening on port ${port}`);
});
