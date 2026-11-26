import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { HttpError } from '../../middleware/errorHandler.js';

const passwordCost = 10;
const publicUserFields = { id: true, name: true, email: true, role: true };
const sessionUserFields = { ...publicUserFields, sessionVersion: true };
// Run the same bcrypt comparison when the email does not exist.
const missingUserHash =
  '$2b$10$vCBaWyb/yL0CjSlcePa5VecQSZ/c8SuVUWs9k/J250BXFoGBMXJSW';

export function createAuthService({ database, jwtSecret }) {
  return {
    async register({ name, email, password }) {
      const passwordHash = await bcrypt.hash(password, passwordCost);

      try {
        return await database.user.create({
          data: { name, email, passwordHash, role: 'STUDENT' },
          select: publicUserFields,
        });
      } catch (error) {
        if (error.code === 'P2002') {
          const message = 'An account already exists for this email';
          throw new HttpError(409, message, { email: message });
        }
        throw error;
      }
    },

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

      const { id, name, role, sessionVersion } = record;
      const token = jwt.sign({ sessionVersion }, jwtSecret, {
        algorithm: 'HS256',
        subject: id,
        expiresIn: '7d',
      });

      return { user: { id, name, email: record.email, role }, token };
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
        data: { passwordHash, sessionVersion: { increment: 1 } },
      });
      if (count === 0) throw new HttpError(401, 'Invalid or expired session');
    },
  };
}
