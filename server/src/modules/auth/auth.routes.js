import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { createAuthController } from './auth.controller.js';
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  meSchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema.js';
import { createAuthService } from './auth.service.js';

export function createAuthRouter({ database, jwtSecret, sendPasswordReset }) {
  const router = Router();
  const service = createAuthService({ database, jwtSecret, sendPasswordReset });
  const controller = createAuthController(service);
  const requireSession = authenticate({ jwtSecret, getUser: service.getUser });
  const rateLimitOptions = {
    windowMs: 15 * 60 * 1000,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new HttpError(429, 'Too many attempts. Try again later.'));
    },
  };
  const limitAttempts = rateLimit({ ...rateLimitOptions, limit: 20 });
  const limitRecoveryAttempts = rateLimit({ ...rateLimitOptions, limit: 10 });
  const limitPasswordChanges = rateLimit({
    ...rateLimitOptions,
    limit: 10,
    keyGenerator: (request) => request.user.id,
  });

  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.post(
    '/register',
    limitAttempts,
    validate(registerSchema),
    controller.register,
  );
  router.post('/login', limitAttempts, validate(loginSchema), controller.login);
  router.post(
    '/forgot-password',
    limitRecoveryAttempts,
    validate(forgotPasswordSchema),
    (_request, _response, next) => {
      if (!sendPasswordReset) {
        return next(
          new HttpError(503, 'Password recovery is currently unavailable.'),
        );
      }
      return next();
    },
    controller.requestPasswordReset,
  );
  router.post(
    '/reset-password',
    limitRecoveryAttempts,
    validate(resetPasswordSchema),
    controller.resetPassword,
  );
  router.get('/me', requireSession, validate(meSchema), controller.me);
  router.put(
    '/password',
    requireSession,
    limitPasswordChanges,
    validate(changePasswordSchema),
    controller.changePassword,
  );

  return router;
}
