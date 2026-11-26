import bcrypt from 'bcrypt';
import { z } from 'zod';
import { createDatabase } from '../src/config/database.js';
import { careers } from './seed-data/careers.js';
import { interestAreas, interestQuestions } from './seed-data/interests.js';
import { skills } from './seed-data/skills.js';

const seedEnvironment = z.object({
  DATABASE_URL: z.string().min(1),
  ADMIN_EMAIL: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  ADMIN_PASSWORD: z
    .string()
    .min(8)
    .refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
});

class SeedError extends Error {}

const seedFailureMessages = {
  P1000: 'Check the username and password in DATABASE_URL.',
  P1001: 'The database could not be reached. Check the host and connection.',
  P1002: 'The database connection timed out. Check the host and try again.',
  P2002: 'A starter record conflicts with an existing catalog entry.',
  P2021:
    'A required table is missing. Apply the migrations to this database first.',
  P2022:
    'A required column is missing. Apply the migrations to this database first.',
  P2028:
    'The seed transaction failed. Check the database connection and retry.',
};

const skillId = (key) => `seed-skill-${key}`;
const areaId = (key) => `seed-area-${key}`;

async function seed() {
  const config = seedEnvironment.safeParse(process.env);
  if (!config.success) {
    throw new SeedError(
      'Set DATABASE_URL, a valid ADMIN_EMAIL, and an ADMIN_PASSWORD of at least 8 characters and at most 72 bytes.',
    );
  }

  const { DATABASE_URL, ADMIN_EMAIL, ADMIN_PASSWORD } = config.data;
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const database = createDatabase(DATABASE_URL);

  try {
    await database.$transaction(
      async (tx) => {
        const admin = await tx.user.upsert({
          where: { email: ADMIN_EMAIL },
          create: {
            name: 'Administrator',
            email: ADMIN_EMAIL,
            passwordHash,
            role: 'ADMIN',
          },
          update: {},
          select: { role: true },
        });
        if (admin.role !== 'ADMIN') {
          throw new SeedError(
            'ADMIN_EMAIL belongs to a student. Use a different email for the administrator.',
          );
        }

        for (const { key, resources, ...fields } of skills) {
          const id = skillId(key);
          await tx.skill.upsert({
            where: { id },
            update: {},
            create: { id, ...fields, resources: { create: resources } },
          });
        }

        for (const [key, name] of Object.entries(interestAreas)) {
          const id = areaId(key);
          await tx.interestArea.upsert({
            where: { id },
            update: {},
            create: { id, name },
          });
        }

        for (const { slug, area, requirements, ...fields } of careers) {
          const id = `seed-career-${slug}`;
          await tx.career.upsert({
            where: { id },
            update: {},
            create: {
              id,
              slug,
              ...fields,
              interestArea: { connect: { id: areaId(area) } },
              requiredSkills: {
                create: requirements.map(([skill, requiredLevel, weight]) => ({
                  skill: { connect: { id: skillId(skill) } },
                  requiredLevel,
                  weight,
                })),
              },
            },
          });
        }

        for (const [
          index,
          { key, text, options },
        ] of interestQuestions.entries()) {
          const id = `seed-question-${key}`;
          await tx.interestQuestion.upsert({
            where: { id },
            update: {},
            create: {
              id,
              text,
              order: index + 1,
              options: {
                create: options.map(({ text: optionText, points }) => ({
                  text: optionText,
                  weights: {
                    create: Object.entries(points).map(([area, value]) => ({
                      interestArea: { connect: { id: areaId(area) } },
                      points: value,
                    })),
                  },
                })),
              },
            },
          });
        }
      },
      { timeout: 120_000 },
    );

    console.log('Starter admin and catalog are ready.');
  } finally {
    await database.$disconnect();
  }
}

seed().catch((error) => {
  if (error instanceof SeedError) {
    console.error(error.message);
  } else {
    const code = error?.code;
    const detail = Object.hasOwn(seedFailureMessages, code)
      ? ` (${code}). ${seedFailureMessages[code]}`
      : '. Check the connection, migrations, and catalog for conflicting starter records.';
    console.error(`Could not seed the database${detail}`);
  }
  process.exitCode = 1;
});
