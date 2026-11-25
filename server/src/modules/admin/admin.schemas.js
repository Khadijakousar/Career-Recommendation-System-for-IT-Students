import { z } from 'zod';

const empty = z.strictObject({});
const id = z.string().trim().min(1).max(100);
const label = z.string().trim().min(1).max(120);
const level = z.number().int().min(1).max(5);
const webUrl = z.url({ protocol: /^https?$/ }).max(2048);
const pageNumber = (maximum) =>
  z
    .string()
    .regex(/^[1-9]\d*$/)
    .transform(Number)
    .pipe(z.number().int().max(maximum));

export const listQuery = z.strictObject({
  page: pageNumber(1000000).default(1),
  limit: pageNumber(100).default(20),
});

export const resourceQuery = listQuery.extend({ skillId: id.optional() });

export function adminRequest({
  body = z.undefined(),
  query = empty,
  hasId = false,
} = {}) {
  return z.object({
    body,
    query,
    params: hasId ? z.strictObject({ id }) : empty,
  });
}

export const skillBody = z.strictObject({
  name: label,
  category: label,
  description: z.string().trim().max(2000).nullable().optional(),
  stage: z.number().int().min(1).max(3),
});

export const careerBody = z.strictObject({
  title: label,
  slug: z
    .string()
    .trim()
    .max(120)
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens',
    ),
  description: z.string().trim().min(1).max(4000),
  interestAreaId: id,
});

export const interestAreaBody = z.strictObject({ name: label });

export const resourceBody = z.strictObject({
  skillId: id,
  title: label,
  url: webUrl,
  type: z.enum(['COURSE', 'VIDEO', 'ARTICLE', 'BOOK', 'DOCS']),
  provider: label.nullable().optional(),
  isFree: z.boolean(),
});

function uniqueBy(items, key, context) {
  const seen = new Set();
  items.forEach((item, index) => {
    const value = item[key];
    if (value === undefined) return;
    if (seen.has(value)) {
      context.addIssue({
        code: 'custom',
        path: [index, key],
        message: 'Select this item only once',
      });
    }
    seen.add(value);
  });
}

export const requirementsBody = z
  .array(
    z.strictObject({
      skillId: id,
      requiredLevel: level,
      weight: level,
    }),
  )
  .max(100)
  .superRefine((items, context) => uniqueBy(items, 'skillId', context));

const optionWeight = z.strictObject({ interestAreaId: id, points: level });
const choiceFields = {
  text: label,
  weights: z
    .array(optionWeight)
    .min(1)
    .max(20)
    .superRefine((items, context) =>
      uniqueBy(items, 'interestAreaId', context),
    ),
};
const questionFields = {
  text: z.string().trim().min(1).max(500),
  order: z.number().int().min(1).max(1000000),
};

export const createQuestionBody = z.strictObject({
  ...questionFields,
  options: z.array(z.strictObject(choiceFields)).min(2).max(12),
});

export const updateQuestionBody = z.strictObject({
  ...questionFields,
  options: z
    .array(z.strictObject({ ...choiceFields, id: id.optional() }))
    .min(2)
    .max(12)
    .superRefine((items, context) => uniqueBy(items, 'id', context)),
});
