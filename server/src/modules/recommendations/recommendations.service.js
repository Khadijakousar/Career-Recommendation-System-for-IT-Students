import { TOP_N } from '../../config/scoring.js';
import { HttpError } from '../../middleware/errorHandler.js';
import { rankCareerMatches } from './engine.js';

const resultFields = {
  careerId: true,
  careerTitle: true,
  skillScore: true,
  interestScore: true,
  totalScore: true,
  rank: true,
};

const runFields = {
  id: true,
  mode: true,
  createdAt: true,
  results: { select: resultFields, orderBy: { rank: 'asc' } },
};

export function createRecommendationService(database) {
  return {
    async latest(userId) {
      const run = await database.recommendationRun.findFirst({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: runFields,
      });
      return { run, topCount: TOP_N };
    },

    async generate(userId) {
      try {
        const run = await database.$transaction(
          async (tx) => {
            const ratings = await tx.studentSkill.findMany({
              where: { userId },
              select: { skillId: true, level: true },
            });
            if (!ratings.length)
              throw new HttpError(400, 'Complete the skills assessment first');

            const [careers, questions, answers] = await Promise.all([
              tx.career.findMany({
                select: {
                  id: true,
                  title: true,
                  interestAreaId: true,
                  requiredSkills: {
                    select: {
                      skillId: true,
                      requiredLevel: true,
                      weight: true,
                    },
                  },
                },
              }),
              tx.interestQuestion.findMany({
                select: {
                  id: true,
                  options: {
                    select: {
                      id: true,
                      weights: {
                        select: { interestAreaId: true, points: true },
                      },
                    },
                  },
                },
              }),
              tx.interestAnswer.findMany({
                where: { userId },
                select: { questionId: true, optionId: true },
              }),
            ]);

            const { mode, results } = rankCareerMatches({
              careers,
              ratings,
              questions,
              answers,
            });
            return tx.recommendationRun.create({
              data: { userId, mode, results: { create: results } },
              select: runFields,
            });
          },
          { isolationLevel: 'RepeatableRead' },
        );
        return { run, topCount: TOP_N };
      } catch (error) {
        if (error.code === 'P2003' || error.code === 'P2034') {
          throw new HttpError(
            409,
            'The catalog changed while generating matches. Try again.',
          );
        }
        throw error;
      }
    },
  };
}
