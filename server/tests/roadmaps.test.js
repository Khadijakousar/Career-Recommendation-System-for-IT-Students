import { once } from 'node:events';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { createApp } from '../src/app.js';
import {
  createRoadmapService,
  roadmapProgress,
} from '../src/modules/roadmaps/roadmaps.service.js';

const secret = 'test-only-jwt-secret-for-roadmaps';
const student = jwt.sign({}, secret, { subject: 'student' });
const admin = jwt.sign({}, secret, { subject: 'admin' });
let server;
let url;

beforeAll(async () => {
  const database = {
    user: {
      async findUnique({ where: { id } }) {
        return { id, role: id === 'admin' ? 'ADMIN' : 'STUDENT' };
      },
    },
  };
  server = createApp({ database, jwtSecret: secret }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  url = `http://127.0.0.1:${server.address().port}/api`;
});

afterAll(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
});

test('career and roadmap endpoints require a student account', async () => {
  const routes = [
    ['GET', '/careers'],
    ['GET', '/careers/slug'],
    ['GET', '/me/careers/id/gap'],
    ['POST', '/me/careers/id/roadmap'],
    ['GET', '/me/roadmaps'],
    ['GET', '/me/roadmaps/id'],
    ['PATCH', '/me/roadmap-steps/id'],
    ['POST', '/me/roadmap-steps/id/apply-rating'],
  ];
  for (const [method, path] of routes) {
    expect((await fetch(url + path, { method })).status).toBe(401);
    expect(
      (
        await fetch(url + path, {
          method,
          headers: { Authorization: `Bearer ${admin}` },
        })
      ).status,
    ).toBe(403);
  }
});

test('clients can only update the status of a roadmap step through PATCH', async () => {
  const headers = {
    Authorization: `Bearer ${student}`,
    'Content-Type': 'application/json',
  };
  for (const body of [
    { status: 'COMPLETE' },
    { status: 'DONE', userId: 'other' },
    { status: 'DONE', targetLevel: 5 },
  ]) {
    const response = await fetch(url + '/me/roadmap-steps/id', {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    expect(response.status).toBe(400);
  }
});

test('roadmap progress counts completed steps and treats an empty roadmap as complete', () => {
  expect(
    roadmapProgress([
      { status: 'DONE' },
      { status: 'IN_PROGRESS' },
      { status: 'NOT_STARTED' },
    ]),
  ).toEqual({
    completedSteps: 1,
    totalSteps: 3,
    progressPercent: 33,
  });
  expect(roadmapProgress([])).toEqual({
    completedSteps: 0,
    totalSteps: 0,
    progressPercent: 100,
  });
});

test('rating confirmation keeps a saved level above the roadmap target', async () => {
  const database = {
    $transaction: (operation) =>
      operation({
        roadmapStep: {
          async findUnique({ where }) {
            expect(where).toEqual({
              id: 'step',
              roadmap: { userId: 'student' },
            });
            return { skillId: 'skill', status: 'DONE', targetLevel: 3 };
          },
        },
        studentSkill: {
          async findUnique() {
            return { level: 5 };
          },
        },
      }),
  };
  await expect(
    createRoadmapService(database).applyRating('student', 'step'),
  ).resolves.toEqual({ skillId: 'skill', level: 5 });
});
