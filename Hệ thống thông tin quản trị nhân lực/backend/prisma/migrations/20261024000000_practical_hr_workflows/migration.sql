ALTER TYPE "DayStatus" ADD VALUE IF NOT EXISTS 'BUSINESS_TRIP';
ALTER TYPE "PersonnelActionType" ADD VALUE IF NOT EXISTS 'PROBATION_FAIL';
ALTER TABLE "leave_requests" ADD COLUMN "chargedDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "overtime_requests"
  ADD COLUMN "actualHours" DOUBLE PRECISION,
  ADD COLUMN "actualNightHours" DOUBLE PRECISION,
  ADD COLUMN "actualConfirmedBy" TEXT,
  ADD COLUMN "actualConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "actualEvidenceUrl" TEXT,
  ADD COLUMN "actualNote" TEXT;
ALTER TABLE "hrms_salary_structure_assignments" ADD COLUMN "toDate" DATE;
ALTER TABLE "hrms_appraisal_cycles"
  ADD COLUMN "participantScope" TEXT NOT NULL DEFAULT 'COMPANY',
  ADD COLUMN "participantIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "hrms_travel_requests"
  ADD COLUMN "confirmedWorkDates" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "attendanceConfirmedAt" TIMESTAMP(3),
  ADD COLUMN "attendanceConfirmedBy" TEXT,
  ADD COLUMN "attendanceEvidenceUrl" TEXT;
ALTER TABLE "probation_reviews" ALTER COLUMN "contractSalary" DROP NOT NULL;
ALTER TABLE "probation_reviews" ALTER COLUMN "contractType" DROP NOT NULL;
ALTER TABLE "probation_reviews" ALTER COLUMN "contractType" DROP DEFAULT;

-- Reconcile existing mirrors to the latest ATS record without inventing offers or hires.
UPDATE "candidates" c SET "stage" = (
  CASE a."stage"::text
    WHEN 'APPLIED' THEN 'NEW' WHEN 'SCREENING' THEN 'SCREENING'
    WHEN 'INTERVIEW_ROUND_1' THEN 'INTERVIEW' WHEN 'INTERVIEW_ROUND_2' THEN 'INTERVIEW'
    WHEN 'OFFER_SENT' THEN 'OFFER' WHEN 'HIRED' THEN 'HIRED' ELSE 'REJECTED'
  END
)::"CandidateStage"
FROM (
  SELECT DISTINCT ON (o."requisitionId", lower(a."email")) o."requisitionId", a."email", a."stage"
  FROM "hrms_job_applicants" a JOIN "hrms_job_openings" o ON o."id" = a."jobOpeningId"
  WHERE o."requisitionId" IS NOT NULL
  ORDER BY o."requisitionId", lower(a."email"), a."createdAt" DESC
) a
WHERE c."requisitionId" = a."requisitionId" AND lower(c."email") = lower(a."email");

INSERT INTO "candidates" ("id", "requisitionId", "fullName", "email", "phone", "stage", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, a."requisitionId", a."candidateName", a."email", a."phone",
  (CASE a."stage"::text WHEN 'APPLIED' THEN 'NEW' WHEN 'SCREENING' THEN 'SCREENING'
    WHEN 'INTERVIEW_ROUND_1' THEN 'INTERVIEW' WHEN 'INTERVIEW_ROUND_2' THEN 'INTERVIEW'
    WHEN 'OFFER_SENT' THEN 'OFFER' WHEN 'HIRED' THEN 'HIRED' ELSE 'REJECTED' END)::"CandidateStage",
  a."createdAt", CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT ON (o."requisitionId", lower(a."email")) o."requisitionId", a.*
  FROM "hrms_job_applicants" a JOIN "hrms_job_openings" o ON o."id" = a."jobOpeningId"
  WHERE o."requisitionId" IS NOT NULL
  ORDER BY o."requisitionId", lower(a."email"), a."createdAt" DESC
) a
WHERE NOT EXISTS (SELECT 1 FROM "candidates" c WHERE c."requisitionId" = a."requisitionId" AND lower(c."email") = lower(a."email"));
