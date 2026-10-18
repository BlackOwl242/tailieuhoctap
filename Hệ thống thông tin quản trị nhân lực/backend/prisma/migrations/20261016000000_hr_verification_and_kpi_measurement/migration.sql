ALTER TABLE "personnel_comprehensive_profiles"
  ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "verifiedById" TEXT,
  ADD COLUMN "dataSource" TEXT NOT NULL DEFAULT 'MANUAL';

ALTER TABLE "hrms_appraisal_goals"
  ADD COLUMN "measurementMode" TEXT NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN "targetValue" DOUBLE PRECISION,
  ADD COLUMN "actualValue" DOUBLE PRECISION,
  ADD COLUMN "measurementUnit" TEXT,
  ADD COLUMN "scoreRationale" TEXT;
