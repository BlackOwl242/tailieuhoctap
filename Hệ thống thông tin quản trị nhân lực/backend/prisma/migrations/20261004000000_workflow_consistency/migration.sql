-- AlterEnum
ALTER TYPE "DayStatus" ADD VALUE 'ABSENT';

-- AlterEnum
ALTER TYPE "ContractType" ADD VALUE 'AMENDMENT';

-- AlterEnum
ALTER TYPE "RequisitionStatus" ADD VALUE 'REVIEWED';

-- AlterEnum
ALTER TYPE "PersonnelActionType" ADD VALUE 'PROBATION_PASS';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PayrollRunStatus" ADD VALUE 'REVIEWED';
ALTER TYPE "PayrollRunStatus" ADD VALUE 'LOCKED';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT,
ADD COLUMN     "taxDependentCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "handover_items" ADD COLUMN     "responsibleRole" TEXT;

-- AlterTable
ALTER TABLE "attendance_days" ADD COLUMN     "paidLeave" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "scheduledMinutes" INTEGER NOT NULL DEFAULT 480;

-- AlterTable
ALTER TABLE "job_requisitions" ADD COLUMN     "assessmentNote" TEXT,
ADD COLUMN     "budgetMonthly" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "financeAssessedBy" TEXT,
ADD COLUMN     "hrAssessedBy" TEXT,
ADD COLUMN     "orgUnitId" TEXT;

-- AlterTable
ALTER TABLE "personnel_actions" ADD COLUMN     "appliedAt" TIMESTAMP(3),
ADD COLUMN     "effectiveAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hr_documents" ADD COLUMN     "reviewedBy" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "personnel_salary_histories" ADD COLUMN     "baseAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "hrms_payroll_runs" ADD COLUMN     "attendancePeriodId" TEXT,
ADD COLUMN     "legacyPeriodId" TEXT,
ADD COLUMN     "lockedAt" TIMESTAMP(3),
ADD COLUMN     "lockedBy" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedBy" TEXT;

-- AlterTable
ALTER TABLE "hrms_payroll_slips" ADD COLUMN     "bankAccount" TEXT,
ADD COLUMN     "bankName" TEXT;

-- AlterTable
ALTER TABLE "hrms_job_openings" ADD COLUMN     "requisitionId" TEXT;

-- AlterTable
ALTER TABLE "hrms_job_offers" ADD COLUMN     "acceptedEvidenceUrl" TEXT,
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "hrms_lifecycle_events" ADD COLUMN     "personnelActionId" TEXT;

-- AlterTable
ALTER TABLE "hrms_onboarding_tasks" ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "hrms_appraisal_reviews" ADD COLUMN     "reviewerId" TEXT;

-- CreateTable
CREATE TABLE "attendance_periods" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "version" INTEGER NOT NULL DEFAULT 1,
    "closedBy" TEXT,
    "closedAt" TIMESTAMP(3),
    "reason" TEXT,
    "snapshot" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attendance_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payroll_loan_deductions" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "payroll_loan_deductions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asset_custody_events" (
    "id" TEXT NOT NULL,
    "assetId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_custody_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_settlements" (
    "id" TEXT NOT NULL,
    "claimId" TEXT NOT NULL,
    "travelRequestId" TEXT,
    "userId" TEXT NOT NULL,
    "advanceApplied" DOUBLE PRECISION NOT NULL,
    "payableAmount" DOUBLE PRECISION NOT NULL,
    "actorId" TEXT NOT NULL,
    "settledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "physical_record_loans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itemKey" TEXT NOT NULL,
    "itemDescription" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "dueDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approvedBy" TEXT,
    "issuedBy" TEXT,
    "returnedBy" TEXT,
    "issuedAt" TIMESTAMP(3),
    "returnedAt" TIMESTAMP(3),
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "physical_record_loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "probation_reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "hrVerifiedBy" TEXT,
    "decidedBy" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "assessment" TEXT NOT NULL,
    "evidenceUrl" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "decisionNote" TEXT,
    "contractSalary" DOUBLE PRECISION NOT NULL,
    "contractType" "ContractType" NOT NULL DEFAULT 'FIXED_TERM',
    "effectiveDate" DATE NOT NULL,
    "contractEndDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "probation_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_training_enrollments" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "score" DOUBLE PRECISION,
    "evidenceUrl" TEXT,
    "certificateId" TEXT,
    "verifiedBy" TEXT,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "hrms_training_enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hr_document_revisions" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "revision" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_document_revisions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "attendance_periods_month_year_key" ON "attendance_periods"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_loan_deductions_payrollRunId_loanId_key" ON "payroll_loan_deductions"("payrollRunId", "loanId");

-- CreateIndex
CREATE INDEX "asset_custody_events_assetId_at_idx" ON "asset_custody_events"("assetId", "at");

-- CreateIndex
CREATE UNIQUE INDEX "expense_settlements_claimId_key" ON "expense_settlements"("claimId");

-- CreateIndex
CREATE INDEX "expense_settlements_travelRequestId_idx" ON "expense_settlements"("travelRequestId");

-- CreateIndex
CREATE INDEX "physical_record_loans_itemKey_status_idx" ON "physical_record_loans"("itemKey", "status");

-- CreateIndex
CREATE INDEX "probation_reviews_userId_status_idx" ON "probation_reviews"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_training_enrollments_programId_userId_key" ON "hrms_training_enrollments"("programId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "hr_document_revisions_documentId_revision_key" ON "hr_document_revisions"("documentId", "revision");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_payroll_runs_legacyPeriodId_key" ON "hrms_payroll_runs"("legacyPeriodId");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_payroll_slips_payrollRunId_userId_key" ON "hrms_payroll_slips"("payrollRunId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_job_openings_requisitionId_key" ON "hrms_job_openings"("requisitionId");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_lifecycle_events_personnelActionId_key" ON "hrms_lifecycle_events"("personnelActionId");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_appraisal_reviews_cycleId_userId_reviewerId_key" ON "hrms_appraisal_reviews"("cycleId", "userId", "reviewerId");

-- AddForeignKey
ALTER TABLE "payroll_loan_deductions" ADD CONSTRAINT "payroll_loan_deductions_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "hrms_payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hr_document_revisions" ADD CONSTRAINT "hr_document_revisions_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "hr_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Legacy approved actions were applied at approval time by the old implementation.
-- Do not replay them or try to reverse historical data automatically.
UPDATE "personnel_actions" SET "effectiveAt" = COALESCE("decidedAt", "createdAt"),
  "appliedAt" = COALESCE("decidedAt", "createdAt") WHERE status = 'APPROVED';
UPDATE "personnel_actions" SET "effectiveAt" = "createdAt" WHERE "effectiveAt" IS NULL;
-- Existing documents were already publicly listed before this change.
UPDATE "hr_documents" SET status = 'PUBLISHED';
