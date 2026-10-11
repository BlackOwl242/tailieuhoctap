ALTER TABLE "hrms_appraisal_goals"
    ADD COLUMN "assignmentScope" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    ADD COLUMN "assignmentOrgUnitId" TEXT,
    ADD COLUMN "assignmentOrgUnitName" TEXT,
    ADD COLUMN "assignmentOrgUnitCode" TEXT;

CREATE INDEX "hrms_appraisal_goals_assignmentOrgUnitId_idx"
    ON "hrms_appraisal_goals"("assignmentOrgUnitId");

ALTER TABLE "hrms_appraisal_goals"
    ADD CONSTRAINT "hrms_appraisal_goals_assignmentOrgUnitId_fkey"
    FOREIGN KEY ("assignmentOrgUnitId") REFERENCES "org_units"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
