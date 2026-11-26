import { roadmapProgress } from '../roadmaps/roadmaps.service.js';

const DASHBOARD_MATCH_LIMIT = 3;

function assessmentStatus(completedCount, totalCount) {
  return {
    completedCount,
    totalCount,
    complete: totalCount > 0 && completedCount === totalCount,
  };
}

function skillAssessment(skillGroups) {
  const ratedCount = skillGroups.reduce(
    (sum, group) => sum + group.ratedCount,
    0,
  );
  const totalCount = skillGroups.reduce(
    (sum, group) => sum + group.totalCount,
    0,
  );
  return assessmentStatus(ratedCount, totalCount);
}

export function createDashboardService(database) {
  return {
    async get(userId) {
      // One statement gives the dashboard a consistent snapshot in one round trip.
      const [dashboard] = await database.$queryRaw`
        WITH latest_run AS (
          SELECT id, mode, "createdAt"
          FROM "RecommendationRun"
          WHERE "userId" = ${userId}
          ORDER BY "createdAt" DESC, id DESC
          LIMIT 1
        ), skill_groups AS (
          SELECT skill.category, count(rating.level)::int AS "ratedCount",
            count(*)::int AS "totalCount", avg(rating.level)::float8 AS "averageLevel"
          FROM "Skill" AS skill
          LEFT JOIN "StudentSkill" AS rating
            ON rating."skillId" = skill.id AND rating."userId" = ${userId}
          GROUP BY skill.category
        )
        SELECT
          (SELECT to_jsonb(profile) FROM (
            SELECT program, semester, cgpa, "completedCourses"
            FROM "StudentProfile" WHERE "userId" = ${userId}
          ) AS profile) AS profile,
          (SELECT count(*)::int FROM "InterestQuestion") AS "questionCount",
          (SELECT count(*)::int FROM "InterestAnswer"
            WHERE "userId" = ${userId}) AS "answerCount",
          ARRAY(SELECT to_jsonb(skill_groups) FROM skill_groups
            ORDER BY category) AS "skillGroups",
          (SELECT jsonb_build_object(
            'id', run.id,
            'mode', run.mode,
            'createdAt', run."createdAt" AT TIME ZONE 'UTC',
            'results', ARRAY(
              SELECT to_jsonb(match) FROM (
                SELECT result."careerId", result."careerTitle", result."skillScore",
                  result."interestScore", result."totalScore", result.rank,
                  jsonb_build_object('slug', career.slug) AS career
                FROM "RecommendationResult" AS result
                JOIN "Career" AS career ON career.id = result."careerId"
                WHERE result."runId" = run.id
                ORDER BY result.rank LIMIT ${DASHBOARD_MATCH_LIMIT}
              ) AS match ORDER BY match.rank
            )
          ) FROM latest_run AS run) AS "latestRecommendations",
          ARRAY(SELECT jsonb_build_object(
            'id', roadmap.id,
            'career', jsonb_build_object('id', career.id, 'title', career.title, 'slug', career.slug),
            'steps', ARRAY(SELECT jsonb_build_object('status', step.status)
              FROM "RoadmapStep" AS step WHERE step."roadmapId" = roadmap.id)
          ) FROM "Roadmap" AS roadmap
          JOIN "Career" AS career ON career.id = roadmap."careerId"
          WHERE roadmap."userId" = ${userId}
          ORDER BY roadmap."createdAt" DESC, roadmap.id DESC) AS roadmaps
      `;

      const {
        profile,
        skillGroups,
        questionCount,
        answerCount,
        roadmaps,
        latestRecommendations: latestRun,
      } = dashboard;

      return {
        profile,
        profileComplete: Boolean(profile),
        assessments: {
          skills: skillAssessment(skillGroups),
          interests: assessmentStatus(answerCount, questionCount),
        },
        latestRecommendations: latestRun && {
          ...latestRun,
          createdAt: new Date(latestRun.createdAt),
        },
        activeRoadmaps: roadmaps
          .map(({ steps, ...roadmap }) => ({
            ...roadmap,
            ...roadmapProgress(steps),
          }))
          .filter(
            ({ totalSteps, completedSteps }) => totalSteps > completedSteps,
          ),
        savedRoadmapCount: roadmaps.length,
        skillGroups,
      };
    },
  };
}
