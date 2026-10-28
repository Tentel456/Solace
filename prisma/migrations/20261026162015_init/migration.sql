-- CreateEnum
CREATE TYPE "LectureStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('TRANSCRIBE', 'SUMMARIZE', 'GENERATE_EMBEDDINGS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lectures" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "originalName" TEXT,
    "storagePath" TEXT,
    "sourceUrl" TEXT,
    "mimeType" TEXT,
    "sizeBytes" BIGINT,
    "durationMs" INTEGER,
    "status" "LectureStatus" NOT NULL DEFAULT 'UPLOADING',
    "errorMessage" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lectures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transcript_segments" (
    "id" UUID NOT NULL,
    "lectureId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transcript_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_summaries" (
    "id" UUID NOT NULL,
    "lectureId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "model" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "lecture_summaries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lecture_sections" (
    "id" UUID NOT NULL,
    "lectureId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lecture_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_jobs" (
    "id" UUID NOT NULL,
    "lectureId" UUID NOT NULL,
    "type" "JobType" NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMPTZ(6),
    "finishedAt" TIMESTAMPTZ(6),
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "processing_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "lectures_userId_createdAt_idx" ON "lectures"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "lectures_status_idx" ON "lectures"("status");

-- CreateIndex
CREATE INDEX "transcript_segments_lectureId_startMs_idx" ON "transcript_segments"("lectureId", "startMs");

-- CreateIndex
CREATE UNIQUE INDEX "transcript_segments_lectureId_position_key" ON "transcript_segments"("lectureId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_summaries_lectureId_key" ON "lecture_summaries"("lectureId");

-- CreateIndex
CREATE INDEX "lecture_sections_lectureId_startMs_idx" ON "lecture_sections"("lectureId", "startMs");

-- CreateIndex
CREATE UNIQUE INDEX "lecture_sections_lectureId_position_key" ON "lecture_sections"("lectureId", "position");

-- CreateIndex
CREATE INDEX "processing_jobs_status_createdAt_idx" ON "processing_jobs"("status", "createdAt");

-- CreateIndex
CREATE INDEX "processing_jobs_lectureId_type_idx" ON "processing_jobs"("lectureId", "type");

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transcript_segments" ADD CONSTRAINT "transcript_segments_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_summaries" ADD CONSTRAINT "lecture_summaries_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lecture_sections" ADD CONSTRAINT "lecture_sections_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_jobs" ADD CONSTRAINT "processing_jobs_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
