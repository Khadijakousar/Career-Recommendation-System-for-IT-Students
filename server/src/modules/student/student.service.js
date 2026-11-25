import { HttpError } from '../../middleware/errorHandler.js';

const profileFields = {
  program: true,
  semester: true,
  cgpa: true,
  completedCourses: true,
};
const ratingFields = { skillId: true, level: true };
const answerFields = { questionId: true, optionId: true };

function formatProfile(profile) {
  return profile
    ? { ...profile, cgpa: profile.cgpa?.toNumber() ?? null }
    : null;
}

export function createStudentService(database) {
  async function saveAssessment(operation) {
    try {
      return await database.$transaction(operation, {
        isolationLevel: 'Serializable',
      });
    } catch (error) {
      if (error.code === 'P2034' || error.code === 'P2003') {
        throw new HttpError(
          409,
          'The assessment changed while you were saving. Try again.',
        );
      }
      throw error;
    }
  }

  return {
    async profile(userId) {
      const profile = await database.studentProfile.findUnique({
        where: { userId },
        select: profileFields,
      });
      return formatProfile(profile);
    },

    async saveProfile(userId, data) {
      const profile = await database.studentProfile.upsert({
        where: { userId },
        create: { userId, ...data },
        update: data,
        select: profileFields,
      });
      return formatProfile(profile);
    },

    async skillCatalog() {
      const skills = await database.skill.findMany({
        orderBy: [{ category: 'asc' }, { name: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          name: true,
          category: true,
          description: true,
          stage: true,
        },
      });
      const groups = new Map();
      for (const { category, ...skill } of skills) {
        if (!groups.has(category)) groups.set(category, []);
        groups.get(category).push(skill);
      }
      return Array.from(groups, ([category, entries]) => ({
        category,
        skills: entries,
      }));
    },

    ratings(userId) {
      return database.studentSkill.findMany({
        where: { userId },
        select: ratingFields,
        orderBy: { skillId: 'asc' },
      });
    },

    saveRatings(userId, ratings) {
      return saveAssessment(async (tx) => {
        const skills = await tx.skill.findMany({
          where: { id: { in: ratings.map(({ skillId }) => skillId) } },
          select: { id: true },
        });
        const valid = new Set(skills.map(({ id }) => id));
        const fields = {};
        ratings.forEach(({ skillId }, index) => {
          if (!valid.has(skillId))
            fields[`${index}.skillId`] = 'This skill is no longer available';
        });
        if (Object.keys(fields).length)
          throw new HttpError(400, 'Invalid skill ratings', fields);
        for (const { skillId, level } of ratings) {
          await tx.studentSkill.upsert({
            where: { userId_skillId: { userId, skillId } },
            create: { userId, skillId, level },
            update: { level },
          });
        }
        return tx.studentSkill.findMany({
          where: { userId },
          select: ratingFields,
          orderBy: { skillId: 'asc' },
        });
      });
    },

    interestQuestions() {
      return database.interestQuestion.findMany({
        orderBy: [{ order: 'asc' }, { id: 'asc' }],
        select: {
          id: true,
          text: true,
          options: { orderBy: { id: 'asc' }, select: { id: true, text: true } },
        },
      });
    },

    answers(userId) {
      return database.interestAnswer.findMany({
        where: { userId },
        select: answerFields,
        orderBy: { questionId: 'asc' },
      });
    },

    saveAnswers(userId, answers) {
      return saveAssessment(async (tx) => {
        const options = await tx.interestOption.findMany({
          where: { id: { in: answers.map(({ optionId }) => optionId) } },
          select: { id: true, questionId: true },
        });
        const questionByOption = new Map(
          options.map(({ id, questionId }) => [id, questionId]),
        );
        const fields = {};
        answers.forEach(({ questionId, optionId }, index) => {
          if (questionByOption.get(optionId) !== questionId) {
            fields[`${index}.optionId`] =
              'Choose an available answer for this question';
          }
        });
        if (Object.keys(fields).length)
          throw new HttpError(400, 'Invalid questionnaire answers', fields);
        for (const { questionId, optionId } of answers) {
          await tx.interestAnswer.upsert({
            where: { userId_questionId: { userId, questionId } },
            create: { userId, questionId, optionId },
            update: { optionId },
          });
        }
        return tx.interestAnswer.findMany({
          where: { userId },
          select: answerFields,
          orderBy: { questionId: 'asc' },
        });
      });
    },
  };
}
