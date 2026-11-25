import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { createAuthController } from './auth.controller.js';
import { loginSchema, meSchema, registerSchema } from './auth.schema.js';
import { createAuthService } from './auth.service.js';

export function createAuthRouter({ database, jwtSecret }) {
  const router = Router();
  const service = createAuthService({ database, jwtSecret });
  const controller = createAuthController(service);
  const limitAttempts = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, _response, next) => {
      next(new HttpError(429, 'Too many attempts. Try again later.'));
    },
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
  router.get(
    '/me',
    authenticate({ jwtSecret, getUser: service.getUser }),
    validate(meSchema),
    controller.me,
  );

  return router;
}
