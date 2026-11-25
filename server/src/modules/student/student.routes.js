import { json, Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createAuthService } from '../auth/auth.service.js';
import { createStudentController } from './student.controller.js';
import {
  answersBody,
  profileBody,
  ratingsBody,
  studentRequest,
} from './student.schemas.js';
import { createStudentService } from './student.service.js';

export function createStudentRouter({ database, jwtSecret }) {
  const router = Router();
  const { getUser } = createAuthService({ database, jwtSecret });
  const read = [
    authenticate({ jwtSecret, getUser }),
    requireRole('STUDENT'),
    (_request, response, next) => {
      response.set('Cache-Control', 'no-store');
      next();
    },
  ];
  const write = [...read, json({ limit: '128kb' })];
  const noBody = validate(studentRequest());
  const controller = createStudentController(createStudentService(database));

  router.get('/profile', ...read, noBody, controller.profile);
  router.put(
    '/profile',
    ...write,
    validate(studentRequest(profileBody)),
    controller.saveProfile,
  );
  router.get('/skills', ...read, noBody, controller.skillCatalog);
  router.get('/me/skills', ...read, noBody, controller.ratings);
  router.put(
    '/me/skills',
    ...write,
    validate(studentRequest(ratingsBody)),
    controller.saveRatings,
  );
  router.get(
    '/interests/questions',
    ...read,
    noBody,
    controller.interestQuestions,
  );
  router.get('/me/interests', ...read, noBody, controller.answers);
  router.put(
    '/me/interests',
    ...write,
    validate(studentRequest(answersBody)),
    controller.saveAnswers,
  );
  return router;
}
