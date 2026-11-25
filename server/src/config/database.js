import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.ts';

export function createDatabase(connectionString) {
  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 3000,
  });

  return new PrismaClient({ adapter });
}
