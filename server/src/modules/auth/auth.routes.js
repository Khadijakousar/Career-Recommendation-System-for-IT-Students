import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { authenticate } from '../../middleware/auth.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { validate } from '../../middleware/validate.js';
import { createAuthController } from './auth.controller.js';
import {
  changePasswordSchema,
  completeSignupSchema,
  forgotPasswordSchema,
  loginSchema,
  meSchema,
  registerSchema,
  requestVerificationSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from './auth.schema.js';
import { createAuthService } from './auth.service.js';
import { createEmailVerificationService } from './email-verification.service.js';

export function createAuthRouter({ database, jwtSecret, sendAccountEmail }) {
  const router = Router();
  const service = createAuthService({ database, jwtSecret, sendAccountEmail });
  const verificationService = createEmailVerificationService({
    database,
    sendAccountEmail,
  });
  const controller = createAuthController(service, verificationService);
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
  const limitVerificationAttempts = rateLimit({
    ...rateLimitOptions,
    limit: 10,
  });
  const limitPasswordChanges = rateLimit({
    ...rateLimitOptions,
    limit: 10,
    keyGenerator: (request) => request.user.id,
  });

  function requireEmailSender(_request, _response, next) {
    if (!sendAccountEmail) {
      return next(
        new HttpError(503, 'Account emails are currently unavailable.'),
      );
    }
    return next();
  }

  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.post(
    '/register',
    limitAttempts,
    validate(registerSchema),
    requireEmailSender,
    controller.register,
  );
  router.post('/login', limitAttempts, validate(loginSchema), controller.login);
  router.post(
    '/complete-signup',
    limitVerificationAttempts,
    validate(completeSignupSchema),
    controller.completeSignup,
  );
  router.post(
    '/verify-email',
    limitVerificationAttempts,
    validate(verifyEmailSchema),
    controller.verifyEmail,
  );
  router.post(
    '/email-verification',
    limitVerificationAttempts,
    requireSession,
    validate(requestVerificationSchema),
    requireEmailSender,
    controller.requestVerification,
  );
  router.post(
    '/forgot-password',
    limitRecoveryAttempts,
    validate(forgotPasswordSchema),
    requireEmailSender,
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
