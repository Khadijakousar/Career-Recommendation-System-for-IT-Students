BEGIN;

-- CreateEnum
CREATE TYPE "ResourceType" AS ENUM ('COURSE', 'VIDEO', 'ARTICLE', 'BOOK', 'DOCS');

-- CreateEnum
CREATE TYPE "RecommendationMode" AS ENUM ('SKILLS_ONLY', 'SKILLS_AND_INTERESTS');

-- CreateEnum
CREATE TYPE "StepStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');

-- CreateTable
CREATE TABLE "StudentProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "semester" INTEGER NOT NULL,
    "cgpa" DECIMAL(3,2),
    "completedCourses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "stage" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "InterestArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "interestAreaId" TEXT NOT NULL,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CareerSkill" (
    "id" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "requiredLevel" INTEGER NOT NULL,
    "weight" INTEGER NOT NULL,

    CONSTRAINT "CareerSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSkill" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,

    CONSTRAINT "StudentSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestQuestion" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "InterestQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "InterestOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestOptionWeight" (
    "id" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "interestAreaId" TEXT NOT NULL,
    "points" INTEGER NOT NULL,

    CONSTRAINT "InterestOptionWeight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterestAnswer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "InterestAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resource" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "type" "ResourceType" NOT NULL,
    "provider" TEXT,
    "isFree" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationRun" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mode" "RecommendationMode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecommendationRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecommendationResult" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "skillScore" DOUBLE PRECISION NOT NULL,
    "interestScore" DOUBLE PRECISION NOT NULL,
    "totalScore" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,

    CONSTRAINT "RecommendationResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "careerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Roadmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoadmapStep" (
    "id" TEXT NOT NULL,
    "roadmapId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "startLevel" INTEGER NOT NULL,
    "targetLevel" INTEGER NOT NULL,
    "status" "StepStatus" NOT NULL DEFAULT 'NOT_STARTED',

    CONSTRAINT "RoadmapStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_name_key" ON "Skill"("name");

-- CreateIndex
CREATE UNIQUE INDEX "InterestArea_name_key" ON "InterestArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Career_title_key" ON "Career"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Career_slug_key" ON "Career"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "CareerSkill_careerId_skillId_key" ON "CareerSkill"("careerId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSkill_userId_skillId_key" ON "StudentSkill"("userId", "skillId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestOption_questionId_id_key" ON "InterestOption"("questionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "InterestOptionWeight_optionId_interestAreaId_key" ON "InterestOptionWeight"("optionId", "interestAreaId");

-- CreateIndex
CREATE UNIQUE INDEX "InterestAnswer_userId_questionId_key" ON "InterestAnswer"("userId", "questionId");

-- CreateIndex
CREATE INDEX "Resource_skillId_idx" ON "Resource"("skillId");

-- CreateIndex
CREATE INDEX "RecommendationRun_userId_createdAt_idx" ON "RecommendationRun"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationResult_runId_careerId_key" ON "RecommendationResult"("runId", "careerId");

-- CreateIndex
CREATE UNIQUE INDEX "RecommendationResult_runId_rank_key" ON "RecommendationResult"("runId", "rank");

-- CreateIndex
CREATE UNIQUE INDEX "Roadmap_userId_careerId_key" ON "Roadmap"("userId", "careerId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapStep_roadmapId_skillId_key" ON "RoadmapStep"("roadmapId", "skillId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Career" ADD CONSTRAINT "Career_interestAreaId_fkey" FOREIGN KEY ("interestAreaId") REFERENCES "InterestArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerSkill" ADD CONSTRAINT "CareerSkill_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CareerSkill" ADD CONSTRAINT "CareerSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestOption" ADD CONSTRAINT "InterestOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "InterestQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestOptionWeight" ADD CONSTRAINT "InterestOptionWeight_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "InterestOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestOptionWeight" ADD CONSTRAINT "InterestOptionWeight_interestAreaId_fkey" FOREIGN KEY ("interestAreaId") REFERENCES "InterestArea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestAnswer" ADD CONSTRAINT "InterestAnswer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterestAnswer" ADD CONSTRAINT "InterestAnswer_questionId_optionId_fkey" FOREIGN KEY ("questionId", "optionId") REFERENCES "InterestOption"("questionId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationRun" ADD CONSTRAINT "RecommendationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationResult" ADD CONSTRAINT "RecommendationResult_runId_fkey" FOREIGN KEY ("runId") REFERENCES "RecommendationRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecommendationResult" ADD CONSTRAINT "RecommendationResult_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Roadmap" ADD CONSTRAINT "Roadmap_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Keep stored levels and weights within the assessment scales.
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_semester_check" CHECK ("semester" BETWEEN 1 AND 8);
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_cgpa_check" CHECK ("cgpa" BETWEEN 0 AND 4);
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_stage_check" CHECK ("stage" BETWEEN 1 AND 3);
ALTER TABLE "CareerSkill" ADD CONSTRAINT "CareerSkill_requiredLevel_check" CHECK ("requiredLevel" BETWEEN 1 AND 5);
ALTER TABLE "CareerSkill" ADD CONSTRAINT "CareerSkill_weight_check" CHECK ("weight" BETWEEN 1 AND 5);
ALTER TABLE "StudentSkill" ADD CONSTRAINT "StudentSkill_level_check" CHECK ("level" BETWEEN 0 AND 5);
ALTER TABLE "InterestOptionWeight" ADD CONSTRAINT "InterestOptionWeight_points_check" CHECK ("points" BETWEEN 1 AND 5);
ALTER TABLE "RoadmapStep" ADD CONSTRAINT "RoadmapStep_levels_check" CHECK (
    "startLevel" BETWEEN 0 AND 5 AND "targetLevel" BETWEEN 1 AND 5 AND "startLevel" < "targetLevel"
);

COMMIT;

