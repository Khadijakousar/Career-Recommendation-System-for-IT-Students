import { json, Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createAuthService } from '../auth/auth.service.js';
import { createAdminController } from './admin.controller.js';
import {
  adminRequest,
  careerBody,
  createQuestionBody,
  interestAreaBody,
  listQuery,
  requirementsBody,
  resourceBody,
  resourceQuery,
  skillBody,
  updateQuestionBody,
} from './admin.schemas.js';
import { catalog, createAdminService } from './admin.service.js';

const bodies = {
  careers: careerBody,
  skills: skillBody,
  'interest-areas': interestAreaBody,
  'interest-questions': createQuestionBody,
  resources: resourceBody,
};

export function createAdminRouter({ database, jwtSecret }) {
  const router = Router();
  const { getUser } = createAuthService({ database, jwtSecret });
  const controller = createAdminController(createAdminService(database));
  const checked = (parts) => validate(adminRequest(parts));
  const checkId = checked({ hasId: true });

  router.use(authenticate({ jwtSecret, getUser }), requireRole('ADMIN'));
  router.use(json({ limit: '64kb' }));
  router.get('/stats', checked(), controller.stats);
  router.put(
    '/careers/:id/skills',
    checked({ hasId: true, body: requirementsBody }),
    controller.replaceRequirements,
  );

  for (const [path, config] of Object.entries(catalog)) {
    const body = bodies[path];
    const update = path === 'interest-questions' ? updateQuestionBody : body;
    router.get(
      `/${path}`,
      checked({ query: path === 'resources' ? resourceQuery : listQuery }),
      controller.list(config),
    );
    router.post(`/${path}`, checked({ body }), controller.save(config, true));
    router.get(`/${path}/:id`, checkId, controller.get(config));
    router.put(
      `/${path}/:id`,
      checked({ hasId: true, body: update }),
      controller.save(config),
    );
    router.delete(`/${path}/:id`, checkId, controller.remove(config));
  }

  return router;
}
