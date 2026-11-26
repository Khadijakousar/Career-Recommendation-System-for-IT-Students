import { expect, test } from 'vitest';
import { createDashboardService } from '../src/modules/dashboard/dashboard.service.js';

function dashboardService(snapshot, userId = 'student') {
  return createDashboardService({
    async $queryRaw(_query, ...params) {
      expect(params).toEqual([userId, userId, userId, userId, 3, userId]);
      return [snapshot];
    },
  });
}

test('an empty catalog has no complete assessments', async () => {
  const service = dashboardService({
    profile: null,
    questionCount: 0,
    answerCount: 0,
    skillGroups: [],
    latestRecommendations: null,
    roadmaps: [],
  });
  expect(await service.get('student')).toEqual({
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

test('dashboard includes profile, ranked matches, and active roadmaps', async () => {
  const userId = 'returning-student';
  const profile = {
    program: 'Computing',
    semester: 3,
    cgpa: null,
    completedCourses: [],
  };
  const latest = {
    id: 'latest',
    createdAt: '2026-11-26T00:00:00+00:00',
    results: [{ rank: 1 }, { rank: 2 }, { rank: 3 }],
  };
  const service = dashboardService(
    {
      profile,
      questionCount: 2,
      answerCount: 1,
      skillGroups: [
        { category: 'Data', ratedCount: 0, totalCount: 1, averageLevel: null },
        { category: 'Web', ratedCount: 2, totalCount: 2, averageLevel: 2.5 },
      ],
      latestRecommendations: latest,
      roadmaps: [
        {
          id: 'active',
          steps: [{ status: 'DONE' }, { status: 'IN_PROGRESS' }],
        },
        { id: 'finished', steps: [{ status: 'DONE' }] },
        { id: 'empty', steps: [] },
      ],
    },
    userId,
  );
  const result = await service.get(userId);
  expect(result.profileComplete).toBe(true);
  expect(result.profile).toEqual(profile);
  expect(result.latestRecommendations).toEqual({
    ...latest,
    createdAt: new Date('2026-11-26T00:00:00.000Z'),
  });
  expect(result.assessments).toEqual({
    skills: { completedCount: 2, totalCount: 3, complete: false },
    interests: { completedCount: 1, totalCount: 2, complete: false },
  });
  expect(result.savedRoadmapCount).toBe(3);
  expect(result.activeRoadmaps).toEqual([
    { id: 'active', completedSteps: 1, totalSteps: 2, progressPercent: 50 },
  ]);
});
