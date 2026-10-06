ALTER TABLE "hrms_salary_components"
  ADD COLUMN "isOvertimeApplicable" BOOLEAN NOT NULL DEFAULT false;

-- Position pay is a contractual wage component in the standard seeded model.
UPDATE "hrms_salary_components"
SET "isOvertimeApplicable" = true
WHERE "code" = 'POSITION_ALLOW' AND "type" = 'EARNING';
