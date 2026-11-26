import { HttpError } from '../../middleware/errorHandler.js';
import {
  analyzeSkillGap,
  orderRoadmapSteps,
} from '../recommendations/engine.js';

const careerSummary = { id: true, title: true, slug: true };
const careerDetails = {
  ...careerSummary,
  description: true,
  interestArea: { select: { name: true } },
};
const requirements = {
  select: {
    skillId: true,
    requiredLevel: true,
    weight: true,
    skill: { select: { id: true, name: true, stage: true } },
  },
  orderBy: { skill: { name: 'asc' } },
};
const roadmapSummary = {
  id: true,
  career: { select: careerSummary },
};
const roadmapDetails = {
  ...roadmapSummary,
  steps: {
    orderBy: { order: 'asc' },
    select: {
      id: true,
      order: true,
      startLevel: true,
      targetLevel: true,
      status: true,
      skill: {
        select: {
          id: true,
          name: true,
          stage: true,
          resources: {
            orderBy: [{ title: 'asc' }, { id: 'asc' }],
            select: {
              id: true,
              title: true,
              url: true,
              type: true,
              provider: true,
              isFree: true,
            },
          },
        },
      },
    },
  },
};

export function roadmapProgress(steps) {
  const completedSteps = steps.filter(({ status }) => status === 'DONE').length;
  const totalSteps = steps.length;
  return {
    completedSteps,
    totalSteps,
    progressPercent:
      totalSteps === 0 ? 100 : Math.round((completedSteps / totalSteps) * 100),
  };
}

function withProgress(roadmap) {
  return { ...roadmap, ...roadmapProgress(roadmap.steps) };
}

async function careerGap(database, userId, careerId) {
  const [career, ratings] = await Promise.all([
    database.career.findUnique({
      where: { id: careerId },
      select: { requiredSkills: requirements },
    }),
    database.studentSkill.findMany({
      where: { userId },
      select: { skillId: true, level: true },
    }),
  ]);
  if (!career) throw new HttpError(404, 'Career not found');
  if (!ratings.length)
    throw new HttpError(400, 'Complete the skills assessment first');
  return analyzeSkillGap(career.requiredSkills, ratings);
}

async function roadmapWrite(database, operation) {
  try {
    return await database.$transaction(operation, {
      isolationLevel: 'Serializable',
    });
  } catch (error) {
    if (['P2002', 'P2003', 'P2034'].includes(error.code)) {
      throw new HttpError(
        409,
        'The roadmap or assessment changed while saving. Try again.',
      );
    }
    throw error;
  }
}

export function createRoadmapService(database) {
  return {
    careers() {
      return database.career.findMany({
        orderBy: [{ title: 'asc' }, { id: 'asc' }],
        select: careerDetails,
      });
    },

    async career(slug) {
      const career = await database.career.findUnique({
        where: { slug },
        select: { ...careerDetails, requiredSkills: requirements },
      });
      if (!career) throw new HttpError(404, 'Career not found');
      return career;
    },

    gap(userId, careerId) {
      return careerGap(database, userId, careerId);
    },

    generate(userId, careerId) {
      return roadmapWrite(database, async (tx) => {
        const { gaps } = await careerGap(tx, userId, careerId);
        const steps = orderRoadmapSteps(gaps);
        const { id: roadmapId } = await tx.roadmap.upsert({
          where: { userId_careerId: { userId, careerId } },
          create: { userId, careerId },
          update: {},
          select: { id: true },
        });

        await tx.roadmapStep.deleteMany({
          where: {
            roadmapId,
            skillId: { notIn: steps.map(({ skillId }) => skillId) },
          },
        });
        for (const [
          index,
          { skillId, studentLevel, requiredLevel },
        ] of steps.entries()) {
          const fields = {
            order: index + 1,
            startLevel: studentLevel,
            targetLevel: requiredLevel,
          };
          await tx.roadmapStep.upsert({
            where: { roadmapId_skillId: { roadmapId, skillId } },
            create: { roadmapId, skillId, ...fields },
            update: fields,
          });
        }

        return withProgress(
          await tx.roadmap.findUnique({
            where: { id: roadmapId },
            select: roadmapDetails,
          }),
        );
      });
    },

    async list(userId) {
      const roadmaps = await database.roadmap.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        select: { ...roadmapSummary, steps: { select: { status: true } } },
      });
      return roadmaps.map(({ steps, ...roadmap }) => ({
        ...roadmap,
        ...roadmapProgress(steps),
      }));
    },

    async get(userId, id) {
      const roadmap = await database.roadmap.findUnique({
        where: { id, userId },
        select: roadmapDetails,
      });
      if (!roadmap) throw new HttpError(404, 'Roadmap not found');
      return withProgress(roadmap);
    },

    async updateStep(userId, id, status) {
      try {
        const { roadmap } = await database.roadmapStep.update({
          where: { id, roadmap: { userId } },
          data: { status },
          select: { roadmap: { select: roadmapDetails } },
        });
        return withProgress(roadmap);
      } catch (error) {
        if (error.code === 'P2025')
          throw new HttpError(404, 'Roadmap step not found');
        throw error;
      }
    },

    applyRating(userId, id) {
      return roadmapWrite(database, async (tx) => {
        const step = await tx.roadmapStep.findUnique({
          where: { id, roadmap: { userId } },
          select: { skillId: true, status: true, targetLevel: true },
        });
        if (!step) throw new HttpError(404, 'Roadmap step not found');
        if (step.status !== 'DONE')
          throw new HttpError(
            409,
            'Complete the step before updating its skill rating',
          );
        const { skillId, targetLevel } = step;
        const identity = { userId, skillId };
        const current = await tx.studentSkill.findUnique({
          where: { userId_skillId: identity },
          select: { level: true },
        });
        if (current?.level >= targetLevel)
          return { skillId, level: current.level };
        return tx.studentSkill.upsert({
          where: { userId_skillId: identity },
          create: { ...identity, level: targetLevel },
          update: { level: targetLevel },
          select: { skillId: true, level: true },
        });
      });
    },
  };
}
