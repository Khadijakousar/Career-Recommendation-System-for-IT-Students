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

    let userId;
    try {
      const payload = jwt.verify(token, jwtSecret, { algorithms: ['HS256'] });
      userId = payload.sub;
    } catch {
      return next(new HttpError(401, 'Invalid or expired session'));
    }

    if (typeof userId !== 'string' || !userId) {
      return next(new HttpError(401, 'Invalid or expired session'));
    }

    const user = await getUser(userId);
    if (!user) {
      return next(new HttpError(401, 'Invalid or expired session'));
    }

    request.user = user;
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
