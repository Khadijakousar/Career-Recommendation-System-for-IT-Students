import { json, Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createAuthService } from '../auth/auth.service.js';
import { studentRequest } from '../student/student.schemas.js';
import { createRoadmapController } from './roadmaps.controller.js';
import { createRoadmapService } from './roadmaps.service.js';

const id = z.string().trim().min(1).max(100);
const status = z.strictObject({
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'DONE']),
});

export function createRoadmapRouter({ database, jwtSecret }) {
  const router = Router();
  const { getUser } = createAuthService({ database, jwtSecret });
  const controller = createRoadmapController(createRoadmapService(database));
  const read = [
    authenticate({ jwtSecret, getUser }),
    requireRole('STUDENT'),
    (_request, response, next) => {
      response.set('Cache-Control', 'no-store');
      next();
    },
  ];
  const write = [...read, json({ limit: '16kb' })];
  const validateParams = (name, schema = id, body) =>
    validate(studentRequest(body, z.strictObject({ [name]: schema })));

  router.get(
    '/careers',
    ...read,
    validate(studentRequest()),
    controller.careers,
  );
  router.get(
    '/careers/:slug',
    ...read,
    validateParams('slug', z.string().min(1).max(120)),
    controller.career,
  );
  router.get(
    '/me/careers/:careerId/gap',
    ...read,
    validateParams('careerId'),
    controller.gap,
  );
  router.post(
    '/me/careers/:careerId/roadmap',
    ...write,
    validateParams('careerId'),
    controller.generate,
  );
  router.get(
    '/me/roadmaps',
    ...read,
    validate(studentRequest()),
    controller.list,
  );
  router.get('/me/roadmaps/:id', ...read, validateParams('id'), controller.get);
  router.patch(
    '/me/roadmap-steps/:stepId',
    ...write,
    validateParams('stepId', id, status),
    controller.updateStep,
  );
  router.post(
    '/me/roadmap-steps/:stepId/apply-rating',
    ...write,
    validateParams('stepId'),
    controller.applyRating,
  );
  return router;
}
