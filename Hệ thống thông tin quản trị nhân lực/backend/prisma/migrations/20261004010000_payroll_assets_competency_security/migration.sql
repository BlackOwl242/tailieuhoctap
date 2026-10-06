-- Compatibility repair: these HR tables existed in the running database but
-- were missing from the checked-in migration history. IF NOT EXISTS lets this
-- migration repair a fresh database while preserving an existing deployment.
DO $$ BEGIN
  CREATE TYPE "ProfileChangeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "profile_change_requests" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "changes" JSONB NOT NULL, "reason" TEXT NOT NULL,
  "attachmentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[], "status" "ProfileChangeStatus" NOT NULL DEFAULT 'PENDING',
  "reviewerId" TEXT, "reviewerNote" TEXT, "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "profile_change_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "hrms_employee_loans" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "employeeName" TEXT NOT NULL, "loanType" TEXT NOT NULL,
  "principalAmount" DOUBLE PRECISION NOT NULL, "interestRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "termMonths" INTEGER NOT NULL DEFAULT 12, "monthlyEmi" DOUBLE PRECISION NOT NULL,
  "totalRepaid" DOUBLE PRECISION NOT NULL DEFAULT 0, "remainingAmount" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "disbursedAt" TIMESTAMP(3), "reason" TEXT, "approvedBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_employee_loans_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "hrms_asset_allocations" (
  "id" TEXT NOT NULL, "assetCode" TEXT NOT NULL, "name" TEXT NOT NULL, "category" TEXT NOT NULL DEFAULT 'IT_EQUIPMENT',
  "serialNumber" TEXT, "assignedUserId" TEXT, "assignedEmployeeName" TEXT, "allocatedDate" TIMESTAMP(3),
  "returnedDate" TIMESTAMP(3), "status" TEXT NOT NULL DEFAULT 'AVAILABLE', "condition" TEXT NOT NULL DEFAULT 'EXCELLENT',
  "value" DOUBLE PRECISION NOT NULL DEFAULT 0, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "hrms_asset_allocations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "hrms_attendance_regularizations" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "employeeName" TEXT NOT NULL, "workDate" DATE NOT NULL,
  "requestedCheckIn" TEXT, "requestedCheckOut" TEXT, "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING', "approvedBy" TEXT, "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_attendance_regularizations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "master_catalog_groups" (
  "id" TEXT NOT NULL, "title" TEXT NOT NULL, "description" TEXT NOT NULL, "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "master_catalog_groups_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "master_catalogs" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL, "groupId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "master_catalogs_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "master_catalog_items" (
  "id" TEXT NOT NULL, "catalogId" TEXT NOT NULL, "code" TEXT NOT NULL, "name" TEXT NOT NULL, "extra" JSONB,
  "sortOrder" INTEGER NOT NULL DEFAULT 0, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "master_catalog_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "profile_change_requests_userId_status_idx" ON "profile_change_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "profile_change_requests_status_idx" ON "profile_change_requests"("status");
CREATE INDEX IF NOT EXISTS "hrms_employee_loans_userId_status_idx" ON "hrms_employee_loans"("userId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_asset_allocations_assetCode_key" ON "hrms_asset_allocations"("assetCode");
CREATE INDEX IF NOT EXISTS "hrms_asset_allocations_assignedUserId_status_idx" ON "hrms_asset_allocations"("assignedUserId", "status");
CREATE INDEX IF NOT EXISTS "hrms_attendance_regularizations_userId_status_idx" ON "hrms_attendance_regularizations"("userId", "status");
CREATE INDEX IF NOT EXISTS "master_catalogs_groupId_idx" ON "master_catalogs"("groupId");
CREATE INDEX IF NOT EXISTS "master_catalog_items_catalogId_idx" ON "master_catalog_items"("catalogId");
CREATE UNIQUE INDEX IF NOT EXISTS "master_catalog_items_catalogId_code_key" ON "master_catalog_items"("catalogId", "code");

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_change_requests_userId_fkey') THEN
    ALTER TABLE "profile_change_requests" ADD CONSTRAINT "profile_change_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profile_change_requests_reviewerId_fkey') THEN
    ALTER TABLE "profile_change_requests" ADD CONSTRAINT "profile_change_requests_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'master_catalogs_groupId_fkey') THEN
    ALTER TABLE "master_catalogs" ADD CONSTRAINT "master_catalogs_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "master_catalog_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'master_catalog_items_catalogId_fkey') THEN
    ALTER TABLE "master_catalog_items" ADD CONSTRAINT "master_catalog_items_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "master_catalogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable
ALTER TABLE "attendance_days" ADD COLUMN "nightWorkedMinutes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "asset_custody_events" ADD COLUMN     "acknowledgedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "expense_settlements" ADD COLUMN     "advanceRefundDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "advanceRefundPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refundStatus" TEXT NOT NULL DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "hrms_payroll_runs" ADD COLUMN     "policySnapshot" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "hrms_travel_requests" ADD COLUMN     "advanceRefundDue" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "advanceRefundPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "refundStatus" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN     "settlementClosedAt" TIMESTAMP(3),
ADD COLUMN     "settlementClosedBy" TEXT;

-- Payment channel is captured for newly disbursed advances so cash and bank
-- payment records cannot be confused with each other.
ALTER TABLE "hrms_employee_advances" ADD COLUMN "paymentMethod" TEXT;

-- AlterTable
ALTER TABLE "overtime_requests" ADD COLUMN     "dayCategory" TEXT NOT NULL DEFAULT 'WEEKDAY',
ADD COLUMN     "nightHours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "minimumWageRegion" TEXT NOT NULL DEFAULT 'I',
ADD COLUMN     "taxResidency" TEXT NOT NULL DEFAULT 'RESIDENT';

-- CreateTable
CREATE TABLE "hrms_kra_evidences" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "submittedBy" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "metricValue" TEXT,
    "evidenceUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_kra_evidences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_competency_assessments" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "competencyCode" TEXT NOT NULL,
    "competencyName" TEXT NOT NULL,
    "currentLevel" INTEGER NOT NULL,
    "targetLevel" INTEGER,
    "selfNotes" TEXT,
    "managerNotes" TEXT,
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "assessedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_competency_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_development_plans" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "assessmentId" TEXT,
    "userId" TEXT NOT NULL,
    "competencyCode" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "successCriteria" TEXT NOT NULL,
    "actions" JSONB NOT NULL DEFAULT '[]',
    "dueDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "evidence" JSONB NOT NULL DEFAULT '[]',
    "resultLevel" INTEGER,
    "employeeNotes" TEXT,
    "managerNotes" TEXT,
    "createdBy" TEXT NOT NULL,
    "reviewedBy" TEXT,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_development_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "hrms_kra_evidences_goalId_createdAt_idx" ON "hrms_kra_evidences"("goalId", "createdAt");

-- CreateIndex
CREATE INDEX "hrms_competency_assessments_userId_competencyCode_idx" ON "hrms_competency_assessments"("userId", "competencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_competency_assessments_cycleId_userId_competencyCode_key" ON "hrms_competency_assessments"("cycleId", "userId", "competencyCode");

-- CreateIndex
CREATE INDEX "hrms_development_plans_userId_competencyCode_status_idx" ON "hrms_development_plans"("userId", "competencyCode", "status");

-- AddForeignKey
ALTER TABLE "hrms_kra_evidences" ADD CONSTRAINT "hrms_kra_evidences_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "hrms_appraisal_goals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_competency_assessments" ADD CONSTRAINT "hrms_competency_assessments_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "hrms_appraisal_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_development_plans" ADD CONSTRAINT "hrms_development_plans_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "hrms_appraisal_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_development_plans" ADD CONSTRAINT "hrms_development_plans_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "hrms_competency_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

