ALTER TABLE "hrms_appraisal_cycles"
  ADD COLUMN "periodType" TEXT NOT NULL DEFAULT 'CUSTOM',
  ADD COLUMN "annualSourceFrequency" TEXT,
  ADD COLUMN "quantityCriteriaWeight" DOUBLE PRECISION NOT NULL DEFAULT 33.3333333333,
  ADD COLUMN "qualityCriteriaWeight" DOUBLE PRECISION NOT NULL DEFAULT 33.3333333333,
  ADD COLUMN "progressCriteriaWeight" DOUBLE PRECISION NOT NULL DEFAULT 33.3333333334;

ALTER TABLE "hrms_appraisal_goals"
  ADD COLUMN "quantityScore" DOUBLE PRECISION,
  ADD COLUMN "qualityScore" DOUBLE PRECISION,
  ADD COLUMN "progressScore" DOUBLE PRECISION;

CREATE INDEX "hrms_appraisal_cycles_periodType_year_idx"
  ON "hrms_appraisal_cycles"("periodType", "year");
