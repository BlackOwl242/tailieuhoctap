ALTER TABLE "hrms_appraisal_cycles"
    ADD COLUMN "organizationSector" TEXT NOT NULL DEFAULT 'enterprise',
    ADD COLUMN "publicPersonnelType" TEXT,
    ADD COLUMN "subordinateWeight" DOUBLE PRECISION NOT NULL DEFAULT 10,
    ADD COLUMN "generalCriteriaWeight" DOUBLE PRECISION NOT NULL DEFAULT 30,
    ADD COLUMN "taskCriteriaWeight" DOUBLE PRECISION NOT NULL DEFAULT 70;

ALTER TABLE "hrms_appraisal_goals"
    ADD COLUMN "criteriaGroup" TEXT NOT NULL DEFAULT 'RESULT';

CREATE INDEX "hrms_appraisal_cycles_organizationSector_year_idx"
    ON "hrms_appraisal_cycles"("organizationSector", "year");
CREATE TABLE "hrms_public_appraisal_decisions" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orgUnitId" TEXT NOT NULL,
    "comparableGroup" TEXT NOT NULL,
    "finalClassification" "AppraisalClassification" NOT NULL,
    "excellentCriteriaConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "quotaExceptionApproved" BOOLEAN NOT NULL DEFAULT false,
    "exceptionDecisionNo" TEXT,
    "decisionNote" TEXT,
    "reviewedById" TEXT NOT NULL,
    "reviewedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrms_public_appraisal_decisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "hrms_public_appraisal_decisions_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "hrms_appraisal_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "hrms_public_appraisal_decisions_cycleId_userId_key"
    ON "hrms_public_appraisal_decisions"("cycleId", "userId");

CREATE INDEX "hrms_public_appraisal_decisions_cycleId_orgUnitId_comparableGroup_finalClassification_idx"
    ON "hrms_public_appraisal_decisions"("cycleId", "orgUnitId", "comparableGroup", "finalClassification");
