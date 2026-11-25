BEGIN;

ALTER TABLE "RecommendationResult" ADD COLUMN "careerTitle" TEXT;

UPDATE "RecommendationResult" AS result
SET "careerTitle" = career."title"
FROM "Career" AS career
WHERE result."careerId" = career."id";

ALTER TABLE "RecommendationResult" ALTER COLUMN "careerTitle" SET NOT NULL;

COMMIT;
