ALTER TABLE "hrms_shift_assignments"
  ADD COLUMN "workDays" INTEGER[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5]::INTEGER[];

ALTER TABLE "hrms_payroll_runs"
  ADD COLUMN "paidBy" TEXT,
  ADD COLUMN "paidAt" TIMESTAMP(3),
  ADD COLUMN "paymentMethod" TEXT,
  ADD COLUMN "paymentReference" TEXT;

ALTER TABLE "hrms_salary_components"
  ADD COLUMN "isInsuranceApplicable" BOOLEAN NOT NULL DEFAULT false;
