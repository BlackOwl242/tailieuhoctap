ALTER TABLE "hrms_employee_loans"
  ADD COLUMN "payrollDeductionAuthorizedAt" TIMESTAMP(3),
  ADD COLUMN "deductionConsentVersion" TEXT;
