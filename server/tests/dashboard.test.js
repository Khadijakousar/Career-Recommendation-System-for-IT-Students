import { expect, test } from 'vitest';
import {
  createDashboardService,
  summarizeSkillGroups,
} from '../src/modules/dashboard/dashboard.service.js';

const groups = [
  {
    category: 'Web',
    skills: [{ id: 'html' }, { id: 'javascript' }, { id: 'css' }],
  },
  { category: 'Data', skills: [{ id: 'sql' }] },
];

test('skills summary counts zero ratings and excludes unrated skills from the average', () => {
  expect(
    summarizeSkillGroups(groups, [
      { skillId: 'html', level: 0 },
      { skillId: 'javascript', level: 5 },
    ]),
  ).toEqual([
    { category: 'Web', ratedCount: 2, totalCount: 3, averageLevel: 2.5 },
    { category: 'Data', ratedCount: 0, totalCount: 1, averageLevel: null },
  ]);
});

test('an empty catalog has no complete assessments', async () => {
  const tx = {
    studentProfile: { findUnique: async () => null },
    skill: { findMany: async () => [] },
    studentSkill: { findMany: async () => [] },
    interestQuestion: { count: async () => 0 },
    interestAnswer: { count: async () => 0 },
    recommendationRun: { findFirst: async () => null },
    roadmap: { findMany: async () => [] },
  };
  const database = { $transaction: (operation) => operation(tx) };
  const result = await createDashboardService(database).get('student');
  expect(result).toEqual({
    profile: null,
    profileComplete: false,
    assessments: {
      skills: { completedCount: 0, totalCount: 0, complete: false },
      interests: { completedCount: 0, totalCount: 0, complete: false },
    },
    latestRecommendations: null,
    activeRoadmaps: [],
    savedRoadmapCount: 0,
    skillGroups: [],
  });
});

test('dashboard scopes records to the student, selects three ranked matches, and filters completed roadmaps', async () => {
  const userId = 'student';
  const profile = {
    program: 'Computing',
    semester: 3,
    cgpa: null,
    completedCourses: [],
  };
  const latest = {
    id: 'latest',
    results: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
  };
  const tx = {
    studentProfile: {
      async findUnique({ where }) {
        expect(where).toEqual({ userId });
        return profile;
      },
    },
    skill: { findMany: async () => [{ id: 'html', category: 'Web' }] },
    studentSkill: {
      async findMany({ where }) {
        expect(where).toEqual({ userId });
        return [{ skillId: 'html', level: 0 }];
      },
    },
    interestQuestion: { count: async () => 2 },
    interestAnswer: {
      async count({ where }) {
        expect(where).toEqual({ userId });
        return 1;
      },
    },
    recommendationRun: {
      async findFirst({ where, orderBy, select }) {
        expect(where).toEqual({ userId });
        expect(orderBy[0]).toEqual({ createdAt: 'desc' });
        expect(select.results).toMatchObject({
          take: 3,
          orderBy: { rank: 'asc' },
        });
        return latest;
      },
    },
    roadmap: {
      async findMany({ where }) {
        expect(where).toEqual({ userId });
        return [
          {
            id: 'active',
            steps: [{ status: 'DONE' }, { status: 'IN_PROGRESS' }],
          },
          { id: 'finished', steps: [{ status: 'DONE' }] },
          { id: 'empty', steps: [] },
        ];
      },
    },
  };
  const database = { $transaction: (operation) => operation(tx) };
  const result = await createDashboardService(database).get(userId);
  expect(result.profileComplete).toBe(true);
  expect(result.profile).toEqual(profile);
  expect(result.latestRecommendations).toEqual(latest);
  expect(result.assessments).toEqual({
    skills: { completedCount: 1, totalCount: 1, complete: true },
    interests: { completedCount: 1, totalCount: 2, complete: false },
  });
  expect(result.savedRoadmapCount).toBe(3);
  expect(result.activeRoadmaps).toEqual([
    { id: 'active', completedSteps: 1, totalSteps: 2, progressPercent: 50 },
  ]);
});
