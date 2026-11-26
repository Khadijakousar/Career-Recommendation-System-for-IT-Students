import { randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../middleware/errorHandler.js';
import { hashEmailToken } from './email-verification.service.js';

const passwordCost = 10;
const publicUserFields = {
  id: true,
  name: true,
  email: true,
  role: true,
  emailVerifiedAt: true,
};
const sessionUserFields = { ...publicUserFields, sessionVersion: true };
// Run the same bcrypt comparison when the email does not exist.
const missingUserHash =
  '$2b$10$vCBaWyb/yL0CjSlcePa5VecQSZ/c8SuVUWs9k/J250BXFoGBMXJSW';
const resetLifetimeMs = 30 * 60 * 1000;
const resetCooldownMs = 60 * 1000;

function updatePassword(passwordHash) {
  return {
    passwordHash,
    sessionVersion: { increment: 1 },
    passwordResetHash: null,
    passwordResetExpiresAt: null,
  };
}

export function createAuthService({ database, jwtSecret, sendAccountEmail }) {
  return {
    async login({ email, password }) {
      const record = await database.user.findUnique({
        where: { email },
        select: { ...sessionUserFields, passwordHash: true, disabledAt: true },
      });

      const passwordMatches = await bcrypt.compare(
        password,
        record?.passwordHash ?? missingUserHash,
      );
      if (!record || !passwordMatches || record.disabledAt) {
        throw new HttpError(401, 'Invalid email or password');
      }

      const { id, name, role, emailVerifiedAt, sessionVersion } = record;
      const token = jwt.sign({ sessionVersion }, jwtSecret, {
        algorithm: 'HS256',
        subject: id,
        expiresIn: '7d',
      });

      return {
        user: { id, name, email: record.email, role, emailVerifiedAt },
        token,
      };
    },

    getUser(id) {
      return database.user.findUnique({
        where: { id, disabledAt: null },
        select: sessionUserFields,
      });
    },

    async changePassword(id, sessionVersion, { currentPassword, newPassword }) {
      const record = await database.user.findUnique({
        where: { id, sessionVersion, disabledAt: null },
        select: { passwordHash: true },
      });
      if (!record) throw new HttpError(401, 'Invalid or expired session');

      if (!(await bcrypt.compare(currentPassword, record.passwordHash))) {
        const message = 'Current password is incorrect';
        throw new HttpError(400, message, { currentPassword: message });
      }

      const passwordHash = await bcrypt.hash(newPassword, passwordCost);
      const { count } = await database.user.updateMany({
        where: {
          id,
          sessionVersion,
          passwordHash: record.passwordHash,
          disabledAt: null,
        },
        data: updatePassword(passwordHash),
      });
      if (count === 0) throw new HttpError(401, 'Invalid or expired session');
    },

    async requestPasswordReset({ email }) {
      const token = randomBytes(32).toString('hex');
      const expiresAt = Date.now() + resetLifetimeMs;
      const { count } = await database.user.updateMany({
        where: {
          email,
          disabledAt: null,
          emailVerifiedAt: { not: null },
          OR: [
            { passwordResetExpiresAt: null },
            {
              passwordResetExpiresAt: {
                lte: new Date(expiresAt - resetCooldownMs),
              },
            },
          ],
        },
        data: {
          passwordResetHash: hashEmailToken(token),
          passwordResetExpiresAt: new Date(expiresAt),
        },
      });
      if (count > 0) await sendAccountEmail(email, token, 'reset');
    },

    async resetPassword({ token, newPassword }) {
      const passwordResetHash = hashEmailToken(token);
      const where = {
        passwordResetHash,
        passwordResetExpiresAt: { gt: new Date() },
        disabledAt: null,
        emailVerifiedAt: { not: null },
      };
      const invalidLink = () =>
        new HttpError(
          400,
          'This reset link is invalid or expired. Request a new link.',
        );

      const account = await database.user.findUnique({
        where,
        select: { id: true },
      });
      if (!account) throw invalidLink();

      const passwordHash = await bcrypt.hash(newPassword, passwordCost);
      const { count } = await database.user.updateMany({
        where: { ...where, passwordResetExpiresAt: { gt: new Date() } },
        data: updatePassword(passwordHash),
      });
      if (count === 0) throw invalidLink();
    },
  };
}
