import { HttpError } from '../../middleware/errorHandler.js';

const questionInclude = {
  options: {
    orderBy: { id: 'asc' },
    include: { weights: { orderBy: { interestAreaId: 'asc' } } },
  },
};

export const catalog = {
  skills: { model: 'skill', orderBy: [{ name: 'asc' }, { id: 'asc' }] },
  careers: {
    model: 'career',
    orderBy: [{ title: 'asc' }, { id: 'asc' }],
    include: {
      interestArea: true,
      requiredSkills: {
        include: { skill: true },
        orderBy: { skill: { name: 'asc' } },
      },
    },
  },
  'interest-areas': {
    model: 'interestArea',
    orderBy: [{ name: 'asc' }, { id: 'asc' }],
  },
  'interest-questions': {
    model: 'interestQuestion',
    orderBy: [{ order: 'asc' }, { id: 'asc' }],
    include: questionInclude,
  },
  resources: {
    model: 'resource',
    orderBy: [{ title: 'asc' }, { id: 'asc' }],
    include: { skill: true },
  },
};

async function write(
  operation,
  { referenceField, protectsHistory = false } = {},
) {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 'P2025')
      throw new HttpError(404, 'Catalog entry not found');
    if (error.code === 'P2002')
      throw new HttpError(
        409,
        'A catalog entry with this name, title, or slug already exists',
      );
    if (error.code === 'P2034')
      throw new HttpError(
        409,
        'The catalog changed while you were editing. Reload and try again.',
      );
    if (error.code === 'P2003') {
      if (protectsHistory)
        throw new HttpError(409, 'This entry is in use and cannot be removed.');
      const message = 'Select an existing catalog entry';
      throw new HttpError(
        400,
        message,
        referenceField ? { [referenceField]: message } : undefined,
      );
    }
    throw error;
  }
}

export function createAdminService(database) {
  const transaction = (operation) =>
    database.$transaction(operation, { isolationLevel: 'Serializable' });

  return {
    async list({ model, orderBy, include }, { page, limit, skillId }) {
      const where = skillId ? { skillId } : undefined;
      const [items, total] = await database.$transaction(
        [
          database[model].findMany({
            where,
            include,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
          }),
          database[model].count({ where }),
        ],
        { isolationLevel: 'RepeatableRead' },
      );
      return { items, total, page, limit };
    },

    async get({ model, include }, id) {
      const item = await database[model].findUnique({ where: { id }, include });
      if (!item) throw new HttpError(404, 'Catalog entry not found');
      return item;
    },

    save({ model, include }, body, id) {
      if (model === 'interestQuestion')
        return saveQuestion(transaction, body, id);
      return write(
        () =>
          id
            ? database[model].update({ where: { id }, data: body, include })
            : database[model].create({ data: body, include }),
        { referenceField: model === 'career' ? 'interestAreaId' : 'skillId' },
      );
    },

    remove({ model }, id) {
      return write(
        () => {
          if (model !== 'interestArea')
            return database[model].delete({ where: { id } });
          return transaction(async (tx) => {
            if (
              await tx.interestOptionWeight.findFirst({
                where: { interestAreaId: id },
                select: { id: true },
              })
            ) {
              throw new HttpError(
                409,
                'This interest area is used by a questionnaire option.',
              );
            }
            await tx.interestArea.delete({ where: { id } });
          });
        },
        { protectsHistory: true },
      );
    },

    replaceRequirements(careerId, requirements) {
      return write(() =>
        transaction(async (tx) => {
          if (
            !(await tx.career.findUnique({
              where: { id: careerId },
              select: { id: true },
            }))
          ) {
            throw new HttpError(404, 'Career not found');
          }
          const skills = await tx.skill.findMany({
            where: { id: { in: requirements.map(({ skillId }) => skillId) } },
            select: { id: true },
          });
          const known = new Set(skills.map(({ id }) => id));
          const badIndex = requirements.findIndex(
            ({ skillId }) => !known.has(skillId),
          );
          if (badIndex !== -1) {
            throw new HttpError(400, 'Invalid career requirements', {
              [`${badIndex}.skillId`]: 'Select an existing skill',
            });
          }
          await tx.careerSkill.deleteMany({ where: { careerId } });
          if (requirements.length) {
            await tx.careerSkill.createMany({
              data: requirements.map((entry) => ({ ...entry, careerId })),
            });
          }
          return tx.career.findUnique({
            where: { id: careerId },
            include: catalog.careers.include,
          });
        }),
      );
    },

    async stats() {
      return transaction(async (tx) => {
        const [students, careers, skills, questions] = await Promise.all([
          tx.user.count({ where: { role: 'STUDENT' } }),
          tx.career.count(),
          tx.skill.count(),
          tx.interestQuestion.count(),
        ]);
        const [skillGroups, interestGroups] = await Promise.all([
          skills
            ? tx.studentSkill.groupBy({
                by: ['userId'],
                where: { user: { role: 'STUDENT' } },
                having: { userId: { _count: { equals: skills } } },
              })
            : [],
          questions
            ? tx.interestAnswer.groupBy({
                by: ['userId'],
                where: { user: { role: 'STUDENT' } },
                having: { userId: { _count: { equals: questions } } },
              })
            : [],
        ]);
        return {
          students,
          careers,
          skills,
          skillsAssessmentsCompleted: skillGroups.length,
          interestAssessmentsCompleted: interestGroups.length,
        };
      });
    },
  };
}

async function saveQuestion(transaction, { options, ...fields }, id) {
  return write(
    () =>
      transaction(async (tx) => {
        const areaIds = [
          ...new Set(
            options.flatMap(({ weights }) =>
              weights.map(({ interestAreaId }) => interestAreaId),
            ),
          ),
        ];
        const areas = await tx.interestArea.findMany({
          where: { id: { in: areaIds } },
          select: { id: true },
        });
        const knownAreas = new Set(areas.map(({ id }) => id));
        const invalidFields = {};
        options.forEach(({ weights }, optionIndex) => {
          weights.forEach(({ interestAreaId }, weightIndex) => {
            if (!knownAreas.has(interestAreaId)) {
              invalidFields[
                `options.${optionIndex}.weights.${weightIndex}.interestAreaId`
              ] = 'Select an existing interest area';
            }
          });
        });
        if (Object.keys(invalidFields).length)
          throw new HttpError(400, 'Invalid interest weights', invalidFields);

        if (!id) {
          return tx.interestQuestion.create({
            data: {
              ...fields,
              options: {
                create: options.map(({ text, weights }) => ({
                  text,
                  weights: { createMany: { data: weights } },
                })),
              },
            },
            include: questionInclude,
          });
        }

        const question = await tx.interestQuestion.findUnique({
          where: { id },
          include: { options: { select: { id: true } } },
        });
        if (!question) throw new HttpError(404, 'Catalog entry not found');
        const currentIds = new Set(question.options.map((option) => option.id));
        const foreignIndex = options.findIndex(
          (option) => option.id && !currentIds.has(option.id),
        );
        if (foreignIndex !== -1) {
          throw new HttpError(400, 'Option does not belong to the question', {
            [`options.${foreignIndex}.id`]:
              'Option does not belong to this question',
          });
        }
        const retained = options.flatMap((option) =>
          option.id ? [option.id] : [],
        );
        await tx.interestOption.deleteMany({
          where: { questionId: id, id: { notIn: retained } },
        });
        for (const { id: optionId, text, weights } of options) {
          if (optionId) {
            await tx.interestOption.update({
              where: { id: optionId },
              data: { text, weights: { deleteMany: {} } },
            });
            await tx.interestOptionWeight.createMany({
              data: weights.map((entry) => ({ ...entry, optionId })),
            });
          } else {
            await tx.interestOption.create({
              data: {
                questionId: id,
                text,
                weights: { createMany: { data: weights } },
              },
            });
          }
        }
        return tx.interestQuestion.update({
          where: { id },
          data: fields,
          include: questionInclude,
        });
      }),
    { protectsHistory: Boolean(id) },
  );
}
