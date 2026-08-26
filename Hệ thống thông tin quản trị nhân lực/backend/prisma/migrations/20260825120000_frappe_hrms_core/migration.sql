-- CreateEnum
CREATE TYPE "ShiftAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SalaryComponentType" AS ENUM ('EARNING', 'DEDUCTION');

-- CreateEnum
CREATE TYPE "PayrollRunStatus" AS ENUM ('DRAFT', 'PROCESSED', 'APPROVED', 'PAID', 'CANCELLED');

-- CreateEnum
CREATE TYPE "JobOpeningStatus" AS ENUM ('DRAFT', 'OPEN', 'IN_PROGRESS', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ApplicantStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW_ROUND_1', 'INTERVIEW_ROUND_2', 'OFFER_SENT', 'HIRED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InterviewRecommendation" AS ENUM ('STRONG_HIRE', 'HIRE', 'HOLD', 'REJECT');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "LifecycleEventType" AS ENUM ('ONBOARDING', 'PROMOTION', 'TRANSFER', 'SEPARATION', 'DISCIPLINARY');

-- CreateEnum
CREATE TYPE "LifecycleEventStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ClaimStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PAID');

-- CreateEnum
CREATE TYPE "GrievanceStatus" AS ENUM ('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateTable
CREATE TABLE "hrms_shift_types" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "lateToleranceMinutes" INTEGER NOT NULL DEFAULT 15,
    "earlyExitToleranceMinutes" INTEGER NOT NULL DEFAULT 15,
    "color" TEXT NOT NULL DEFAULT '#3b82f6',
    "enableAutoAttendance" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_shift_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_shift_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shiftTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "ShiftAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "assignedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_shift_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_salary_components" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SalaryComponentType" NOT NULL,
    "isTaxApplicable" BOOLEAN NOT NULL DEFAULT true,
    "isFormulaBased" BOOLEAN NOT NULL DEFAULT false,
    "formula" TEXT,
    "defaultAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_salary_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_salary_structures" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "payrollFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_salary_structure_items" (
    "id" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "formula" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_salary_structure_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_salary_structure_assignments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "structureId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "baseSalary" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_salary_structure_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_payroll_runs" (
    "id" TEXT NOT NULL,
    "periodName" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "status" "PayrollRunStatus" NOT NULL DEFAULT 'DRAFT',
    "totalEmployees" INTEGER NOT NULL DEFAULT 0,
    "totalGrossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalNetPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_payroll_slips" (
    "id" TEXT NOT NULL,
    "payrollRunId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "employeeCode" TEXT,
    "department" TEXT,
    "jobTitle" TEXT,
    "workingDays" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "actualWorkDays" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "baseSalary" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "grossPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalDeduction" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netPay" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "breakdown" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_payroll_slips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_job_openings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "designation" TEXT,
    "vacancies" INTEGER NOT NULL DEFAULT 1,
    "minExperience" INTEGER NOT NULL DEFAULT 1,
    "salaryRange" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "closingDate" TIMESTAMP(3),
    "status" "JobOpeningStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_job_openings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_job_applicants" (
    "id" TEXT NOT NULL,
    "jobOpeningId" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "stage" "ApplicantStage" NOT NULL DEFAULT 'APPLIED',
    "rating" INTEGER NOT NULL DEFAULT 0,
    "resumeUrl" TEXT,
    "coverLetter" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_job_applicants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_interview_rounds" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "roundName" TEXT NOT NULL,
    "interviewerName" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "score" DOUBLE PRECISION,
    "recommendation" "InterviewRecommendation" NOT NULL DEFAULT 'HOLD',
    "feedback" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_interview_rounds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_job_offers" (
    "id" TEXT NOT NULL,
    "applicantId" TEXT NOT NULL,
    "offerDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "designation" TEXT NOT NULL,
    "offeredSalary" DOUBLE PRECISION NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_job_offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_lifecycle_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "type" "LifecycleEventType" NOT NULL,
    "status" "LifecycleEventStatus" NOT NULL DEFAULT 'PENDING',
    "title" TEXT NOT NULL,
    "decisionNo" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_lifecycle_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_onboarding_tasks" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'IT',
    "assignee" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_onboarding_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_appraisal_cycles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_appraisal_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_appraisal_goals" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "kraTitle" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "weightage" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "targetMetric" TEXT NOT NULL,
    "selfScore" DOUBLE PRECISION,
    "managerScore" DOUBLE PRECISION,
    "finalScore" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_appraisal_goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_appraisal_reviews" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "relationship" TEXT NOT NULL DEFAULT 'MANAGER',
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "feedback" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_appraisal_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_travel_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "fromLocation" TEXT NOT NULL,
    "toLocation" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3) NOT NULL,
    "estimatedBudget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_travel_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_employee_advances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "travelRequestId" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "disbursedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_employee_advances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_expense_claims" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "travelRequestId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TRAVEL',
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "approvedAmount" DOUBLE PRECISION,
    "status" "ClaimStatus" NOT NULL DEFAULT 'DRAFT',
    "items" JSONB NOT NULL DEFAULT '[]',
    "receiptUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "submittedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_training_programs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trainerName" TEXT NOT NULL,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxParticipants" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'UPCOMING',
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_training_programs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_training_feedbacks" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comments" TEXT,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_training_feedbacks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_grievances" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeName" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'WORK_ENVIRONMENT',
    "description" TEXT NOT NULL,
    "status" "GrievanceStatus" NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolvedBy" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_grievances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hrms_salary_components_code_key" ON "hrms_salary_components"("code");

-- CreateIndex
CREATE INDEX "hrms_shift_assignments_userId_startDate_idx" ON "hrms_shift_assignments"("userId", "startDate");

-- CreateIndex
CREATE INDEX "hrms_salary_structure_items_structureId_idx" ON "hrms_salary_structure_items"("structureId");

-- CreateIndex
CREATE INDEX "hrms_salary_structure_assignments_userId_isActive_idx" ON "hrms_salary_structure_assignments"("userId", "isActive");

-- CreateIndex
CREATE INDEX "hrms_payroll_slips_payrollRunId_userId_idx" ON "hrms_payroll_slips"("payrollRunId", "userId");

-- CreateIndex
CREATE INDEX "hrms_job_applicants_jobOpeningId_stage_idx" ON "hrms_job_applicants"("jobOpeningId", "stage");

-- CreateIndex
CREATE INDEX "hrms_interview_rounds_applicantId_idx" ON "hrms_interview_rounds"("applicantId");

-- CreateIndex
CREATE INDEX "hrms_job_offers_applicantId_idx" ON "hrms_job_offers"("applicantId");

-- CreateIndex
CREATE INDEX "hrms_lifecycle_events_userId_type_idx" ON "hrms_lifecycle_events"("userId", "type");

-- CreateIndex
CREATE INDEX "hrms_appraisal_goals_cycleId_userId_idx" ON "hrms_appraisal_goals"("cycleId", "userId");

-- CreateIndex
CREATE INDEX "hrms_appraisal_reviews_cycleId_userId_idx" ON "hrms_appraisal_reviews"("cycleId", "userId");

-- CreateIndex
CREATE INDEX "hrms_travel_requests_userId_idx" ON "hrms_travel_requests"("userId");

-- CreateIndex
CREATE INDEX "hrms_employee_advances_userId_idx" ON "hrms_employee_advances"("userId");

-- CreateIndex
CREATE INDEX "hrms_expense_claims_userId_status_idx" ON "hrms_expense_claims"("userId", "status");

-- CreateIndex
CREATE INDEX "hrms_training_feedbacks_programId_idx" ON "hrms_training_feedbacks"("programId");

-- CreateIndex
CREATE INDEX "hrms_grievances_userId_status_idx" ON "hrms_grievances"("userId", "status");

-- AddForeignKey
ALTER TABLE "hrms_shift_assignments" ADD CONSTRAINT "hrms_shift_assignments_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "hrms_shift_types"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_structure_items" ADD CONSTRAINT "hrms_salary_structure_items_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "hrms_salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_structure_items" ADD CONSTRAINT "hrms_salary_structure_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "hrms_salary_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_structure_assignments" ADD CONSTRAINT "hrms_salary_structure_assignments_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "hrms_salary_structures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_payroll_slips" ADD CONSTRAINT "hrms_payroll_slips_payrollRunId_fkey" FOREIGN KEY ("payrollRunId") REFERENCES "hrms_payroll_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_job_applicants" ADD CONSTRAINT "hrms_job_applicants_jobOpeningId_fkey" FOREIGN KEY ("jobOpeningId") REFERENCES "hrms_job_openings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_interview_rounds" ADD CONSTRAINT "hrms_interview_rounds_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "hrms_job_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_job_offers" ADD CONSTRAINT "hrms_job_offers_applicantId_fkey" FOREIGN KEY ("applicantId") REFERENCES "hrms_job_applicants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_appraisal_goals" ADD CONSTRAINT "hrms_appraisal_goals_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "hrms_appraisal_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_appraisal_reviews" ADD CONSTRAINT "hrms_appraisal_reviews_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "hrms_appraisal_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_employee_advances" ADD CONSTRAINT "hrms_employee_advances_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "hrms_travel_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_expense_claims" ADD CONSTRAINT "hrms_expense_claims_travelRequestId_fkey" FOREIGN KEY ("travelRequestId") REFERENCES "hrms_travel_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_training_feedbacks" ADD CONSTRAINT "hrms_training_feedbacks_programId_fkey" FOREIGN KEY ("programId") REFERENCES "hrms_training_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
