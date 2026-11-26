import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import { HttpError } from '../../middleware/errorHandler.js';

const lifetimeMs = 30 * 60 * 1000;
const cooldownMs = 60 * 1000;

export function hashEmailToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function invalidLink() {
  return new HttpError(
    400,
    'This confirmation link is invalid or expired. Request a new link.',
  );
}

export function createEmailVerificationService({ database, sendAccountEmail }) {
  async function sendLink(email, purpose) {
    const now = Date.now();
    const token = randomBytes(32).toString('hex');
    const pending = {
      email,
      purpose,
      tokenHash: hashEmailToken(token),
      expiresAt: new Date(now + lifetimeMs),
    };
    const { count } = await database.emailVerification.createMany({
      data: pending,
      skipDuplicates: true,
    });
    if (!count) {
      const { count: refreshed } = await database.emailVerification.updateMany({
        where: {
          email,
          expiresAt: { lte: new Date(now + lifetimeMs - cooldownMs) },
        },
        data: pending,
      });
      if (!refreshed) return;
    }
    await sendAccountEmail(email, token, purpose);
  }

  async function getLink(token, purpose) {
    const tokenHash = hashEmailToken(token);
    const pending = await database.emailVerification.findUnique({
      where: { tokenHash },
    });
    if (
      !pending ||
      pending.expiresAt <= new Date() ||
      pending.purpose !== purpose
    ) {
      throw invalidLink();
    }
    return pending;
  }

  async function consumeLink(transaction, tokenHash) {
    const { count } = await transaction.emailVerification.deleteMany({
      where: { tokenHash, expiresAt: { gt: new Date() } },
    });
    if (!count) throw invalidLink();
  }

  return {
    async register({ email }) {
      const account = await database.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!account) await sendLink(email, 'signup');
    },

    async requestVerification(id) {
      const account = await database.user.findUnique({
        where: { id, disabledAt: null, emailVerifiedAt: null },
        select: { email: true },
      });
      if (account) await sendLink(account.email, 'verify');
    },

    async completeSignup({ token, name, newPassword }) {
      const { email, tokenHash } = await getLink(token, 'signup');
      const passwordHash = await bcrypt.hash(newPassword, 10);
      try {
        await database.$transaction(async (transaction) => {
          await consumeLink(transaction, tokenHash);
          await transaction.user.create({
            data: {
              name,
              email,
              passwordHash,
              role: 'STUDENT',
              emailVerifiedAt: new Date(),
            },
            select: { id: true },
          });
        });
      } catch (error) {
        if (error.code === 'P2002') throw invalidLink();
        throw error;
      }
    },

    async verifyEmail({ token, password }) {
      const { email, tokenHash } = await getLink(token, 'verify');
      const where = { email, disabledAt: null, emailVerifiedAt: null };
      const account = await database.user.findUnique({
        where,
        select: { id: true, passwordHash: true, sessionVersion: true },
      });
      if (!account) throw invalidLink();
      if (!(await bcrypt.compare(password, account.passwordHash))) {
        const message = 'Current password is incorrect';
        throw new HttpError(400, message, { password: message });
      }
      await database.$transaction(async (transaction) => {
        await consumeLink(transaction, tokenHash);
        const { count } = await transaction.user.updateMany({
          where: {
            ...where,
            id: account.id,
            sessionVersion: account.sessionVersion,
          },
          data: {
            emailVerifiedAt: new Date(),
            passwordResetHash: null,
            passwordResetExpiresAt: null,
          },
        });
        if (!count) throw invalidLink();
      });
    },
  };
}
