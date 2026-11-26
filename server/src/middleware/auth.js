import jwt from 'jsonwebtoken';
import { HttpError } from './errorHandler.js';

export function authenticate({ jwtSecret, getUser }) {
  return async (request, _response, next) => {
    const token = /^Bearer (\S+)$/i.exec(
      request.get('Authorization') ?? '',
    )?.[1];

    if (!token) {
      return next(new HttpError(401, 'Authentication required'));
    }

    let payload;
    try {
      payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
    } catch {
      return next(new HttpError(401, 'Invalid or expired session'));
    }

    // Sessions issued before the session version migration start at version zero.
    const { sub: userId, sessionVersion: tokenVersion = 0 } = payload;
    if (typeof userId !== 'string' || !userId) {
      return next(new HttpError(401, 'Invalid or expired session'));
    }

    const user = await getUser(userId);
    if (!user || user.sessionVersion !== tokenVersion) {
      return next(new HttpError(401, 'Invalid or expired session'));
    }

    const { sessionVersion, ...publicUser } = user;
    request.user = publicUser;
    request.sessionVersion = sessionVersion;
    return next();
  };
}

export function requireRole(...roles) {
  return (request, _response, next) => {
    if (!request.user) {
      return next(new HttpError(401, 'Authentication required'));
    }

    if (!roles.includes(request.user.role)) {
      return next(new HttpError(403, 'Access denied'));
    }

    return next();
  };
}
