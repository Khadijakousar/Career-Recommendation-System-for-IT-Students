import { json, Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createAuthService } from '../auth/auth.service.js';
import { studentRequest } from '../student/student.schemas.js';
import { createRecommendationController } from './recommendations.controller.js';
import { createRecommendationService } from './recommendations.service.js';

export function createRecommendationRouter({ database, jwtSecret }) {
  const router = Router();
  const { getUser } = createAuthService({ database, jwtSecret });
  const controller = createRecommendationController(
    createRecommendationService(database),
  );
  const noBody = validate(studentRequest());

  router.use(authenticate({ jwtSecret, getUser }), requireRole('STUDENT'));
  router.use((_request, response, next) => {
    response.set('Cache-Control', 'no-store');
    next();
  });
  router.get('/latest', noBody, controller.latest);
  router.post('/', json({ limit: '16kb' }), noBody, controller.generate);
  return router;
}
