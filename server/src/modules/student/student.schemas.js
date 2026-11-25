import { z } from 'zod';

const empty = z.strictObject({});
const id = z.string().trim().min(1).max(100);

export function studentRequest(body = z.undefined(), params = empty) {
  return z.object({ body, params, query: empty });
}

export const profileBody = z.strictObject({
  program: z.string().trim().min(1, 'Enter your program').max(120),
  semester: z.number().int().min(1).max(8),
  cgpa: z.number().min(0).max(4).multipleOf(0.01).nullable().default(null),
  completedCourses: z
    .array(z.string().trim().min(1).max(150))
    .max(100)
    .default([]),
});

function distinctEntries(entry, key) {
  return z
    .array(entry)
    .min(1)
    .superRefine((items, context) => {
      const seen = new Set();
      items.forEach((item, index) => {
        if (seen.has(item[key])) {
          context.addIssue({
            code: 'custom',
            path: [index, key],
            message: 'Submit one response per item',
          });
        }
        seen.add(item[key]);
      });
    });
}

export const ratingsBody = distinctEntries(
  z.strictObject({
    skillId: id,
    level: z.number().int().min(0).max(5),
  }),
  'skillId',
);

export const answersBody = distinctEntries(
  z.strictObject({
    questionId: id,
    optionId: id,
  }),
  'questionId',
);
