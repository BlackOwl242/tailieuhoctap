ALTER TABLE "hrms_salary_structures"
  ADD COLUMN "jobTitle" TEXT,
  ADD COLUMN "orgUnitId" TEXT;

CREATE INDEX "hrms_salary_structures_jobTitle_orgUnitId_idx"
  ON "hrms_salary_structures"("jobTitle", "orgUnitId");

ALTER TABLE "hrms_salary_structures"
  ADD CONSTRAINT "hrms_salary_structures_orgUnitId_fkey"
  FOREIGN KEY ("orgUnitId") REFERENCES "org_units"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "attendance_days" ADD COLUMN "leaveType" TEXT;
