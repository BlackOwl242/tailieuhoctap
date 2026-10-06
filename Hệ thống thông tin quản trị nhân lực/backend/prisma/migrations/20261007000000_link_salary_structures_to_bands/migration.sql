ALTER TABLE "hrms_salary_structures"
  ADD COLUMN "salaryBandId" TEXT;

CREATE INDEX "hrms_salary_structures_salaryBandId_isActive_idx"
  ON "hrms_salary_structures"("salaryBandId", "isActive");

ALTER TABLE "hrms_salary_structures"
  ADD CONSTRAINT "hrms_salary_structures_salaryBandId_fkey"
  FOREIGN KEY ("salaryBandId") REFERENCES "hrms_salary_bands"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
