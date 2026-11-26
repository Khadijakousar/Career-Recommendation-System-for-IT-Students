import bcrypt from 'bcrypt';
import { z } from 'zod';
import { createDatabase } from '../src/config/database.js';
import {
  accountEmail,
  accountName,
  accountPassword,
} from '../src/modules/auth/auth.schema.js';

const targetEnvironment = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: accountEmail,
});
const provisionEnvironment = targetEnvironment.extend({
  ADMIN_NAME: accountName,
  ADMIN_PASSWORD: accountPassword,
});

class AdminError extends Error {}

const activeAdmin = { role: 'ADMIN', disabledAt: null };
const failureMessages = {
  P2002:
    'This email already belongs to an account. Use an unused email address.',
  P2021: 'A required table is missing. Apply the database migrations first.',
  P2022: 'A required column is missing. Apply the database migrations first.',
  P2034:
    'Another update conflicted with this operation. Check the handoff state and retry.',
};

async function retireAdmin(database, email) {
  await database.$transaction(
    async (transaction) => {
      const admin = await transaction.user.findUnique({
        where: { email, ...activeAdmin },
        select: { id: true },
      });
      if (!admin)
        throw new AdminError(
          'This email does not belong to an active administrator.',
        );

      if ((await transaction.user.count({ where: activeAdmin })) <= 1) {
        throw new AdminError(
          'The last active administrator cannot be retired.',
        );
      }

      await transaction.user.update({
        where: { id: admin.id },
        data: { disabledAt: new Date(), sessionVersion: { increment: 1 } },
      });
    },
    { isolationLevel: 'Serializable' },
  );
}

async function main() {
  const action = process.argv[2];
  if (action !== 'provision' && action !== 'retire') {
    throw new AdminError(
      'Run npm run admin:provision or npm run admin:retire.',
    );
  }

  const schema =
    action === 'provision' ? provisionEnvironment : targetEnvironment;
  const config = schema.safeParse(process.env);
  if (!config.success) {
    const invalidKeys = config.error.issues.map((issue) => issue.path[0]);
    throw new AdminError(
      `Set valid values for ${[...new Set(invalidKeys)].join(', ')}.`,
    );
  }

  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_NAME, ADMIN_PASSWORD } = config.data;
  const database = createDatabase(DATABASE_URL);
  try {
    if (action === 'provision') {
      await database.user.create({
        data: {
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
          role: 'ADMIN',
        },
        select: { id: true },
      });
      console.log(`Administrator account created for ${ADMIN_EMAIL}.`);
    } else {
      await retireAdmin(database, ADMIN_EMAIL);
      console.log(`Administrator account retired for ${ADMIN_EMAIL}.`);
    }
  } finally {
    await database.$disconnect();
  }
}

main().catch((error) => {
  const message =
    error instanceof AdminError
      ? error.message
      : (failureMessages[error.code] ??
        'The operation failed. Check the database connection and migrations.');
  console.error(message);
  process.exitCode = 1;
});
