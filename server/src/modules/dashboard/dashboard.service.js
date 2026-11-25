import { createRecommendationService } from '../recommendations/recommendations.service.js';
import { createRoadmapService } from '../roadmaps/roadmaps.service.js';
import { createStudentService } from '../student/student.service.js';

const DASHBOARD_MATCH_LIMIT = 3;

function assessmentStatus(completedCount, totalCount) {
  return {
    completedCount,
    totalCount,
    complete: totalCount > 0 && completedCount === totalCount,
  };
}

export function summarizeSkillGroups(groups, ratings) {
  const levels = new Map(ratings.map(({ skillId, level }) => [skillId, level]));
  return groups.map(({ category, skills }) => {
    const ratedLevels = skills
      .map(({ id }) => levels.get(id))
      .filter((level) => level !== undefined);
    const ratedCount = ratedLevels.length;
    return {
      category,
      ratedCount,
      totalCount: skills.length,
      averageLevel: ratedCount
        ? ratedLevels.reduce((total, level) => total + level, 0) / ratedCount
        : null,
    };
  });
}

export function createDashboardService(database) {
  return {
    get(userId) {
      return database.$transaction(
        async (tx) => {
          const student = createStudentService(tx);
          const recommendations = createRecommendationService(tx);
          const roadmaps = createRoadmapService(tx);
          const [
            profile,
            skillCatalog,
            ratings,
            questionCount,
            answerCount,
            { run },
            savedRoadmaps,
          ] = await Promise.all([
            student.profile(userId),
            student.skillCatalog(),
            student.ratings(userId),
            tx.interestQuestion.count(),
            tx.interestAnswer.count({ where: { userId } }),
            recommendations.latest(userId, DASHBOARD_MATCH_LIMIT),
            roadmaps.list(userId),
          ]);
          const skillGroups = summarizeSkillGroups(skillCatalog, ratings);
          const skillCount = skillGroups.reduce(
            (total, group) => total + group.totalCount,
            0,
          );

          return {
            profile,
            profileComplete: Boolean(profile),
            assessments: {
              skills: assessmentStatus(ratings.length, skillCount),
              interests: assessmentStatus(answerCount, questionCount),
            },
            latestRecommendations: run,
            activeRoadmaps: savedRoadmaps.filter(
              ({ totalSteps, completedSteps }) => totalSteps > completedSteps,
            ),
            savedRoadmapCount: savedRoadmaps.length,
            skillGroups,
          };
        },
        { isolationLevel: 'RepeatableRead' },
      );
    },
  };
}
