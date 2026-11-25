import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { errorHandler, HttpError } from './middleware/errorHandler.js';
import { createAdminRouter } from './modules/admin/admin.routes.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createStudentRouter } from './modules/student/student.routes.js';

export function createApp({ clientUrl, checkDatabase, database, jwtSecret }) {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: clientUrl }));

  app.get('/api/health', async (_request, response) => {
    try {
      await checkDatabase();
      return response.json({ data: { status: 'ok' } });
    } catch {
      return response
        .status(503)
        .json({ error: { message: 'Database unavailable' } });
    }
  });

  app.use(
    '/api/auth',
    express.json({ limit: '16kb' }),
    createAuthRouter({ database, jwtSecret }),
  );
  app.use('/api/admin', createAdminRouter({ database, jwtSecret }));
  app.use('/api', createStudentRouter({ database, jwtSecret }));

  app.use((_request, _response, next) => {
    next(new HttpError(404, 'Route not found'));
  });
  app.use(errorHandler);

  return app;
}
