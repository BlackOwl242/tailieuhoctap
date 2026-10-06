CREATE TYPE "CompensationBasis" AS ENUM ('MONTHLY', 'DAILY', 'HOURLY');
CREATE TYPE "SalaryBandStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

CREATE TABLE "hrms_salary_bands" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "levelTitle" TEXT NOT NULL,
    "minSalary" DOUBLE PRECISION NOT NULL,
    "midSalary" DOUBLE PRECISION NOT NULL,
    "maxSalary" DOUBLE PRECISION NOT NULL,
    "reviewCycleMonths" INTEGER NOT NULL DEFAULT 12,
    "jobTitles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "criteria" TEXT NOT NULL,
    "benchmarkSource" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "effectiveTo" DATE,
    "status" "SalaryBandStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrms_salary_bands_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hrms_salary_bands_code_effectiveFrom_key" ON "hrms_salary_bands"("code", "effectiveFrom");
CREATE INDEX "hrms_salary_bands_status_effectiveFrom_effectiveTo_idx" ON "hrms_salary_bands"("status", "effectiveFrom", "effectiveTo");

ALTER TABLE "users" ADD COLUMN "salaryBandId" TEXT;
ALTER TABLE "contracts" ADD COLUMN "compensationBasis" "CompensationBasis" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "hrms_job_openings"
  ADD COLUMN "salaryBandId" TEXT,
  ADD COLUMN "minimumInterviewRounds" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "probationDays" INTEGER;
ALTER TABLE "hrms_appraisal_cycles"
  ADD COLUMN "selfWeight" DOUBLE PRECISION NOT NULL DEFAULT 20,
  ADD COLUMN "peerWeight" DOUBLE PRECISION NOT NULL DEFAULT 30,
  ADD COLUMN "managerWeight" DOUBLE PRECISION NOT NULL DEFAULT 50;
ALTER TABLE "hrms_competency_assessments" ADD COLUMN "evidenceUrl" TEXT;

ALTER TABLE "users" ADD CONSTRAINT "users_salaryBandId_fkey"
  FOREIGN KEY ("salaryBandId") REFERENCES "hrms_salary_bands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hrms_job_openings" ADD CONSTRAINT "hrms_job_openings_salaryBandId_fkey"
  FOREIGN KEY ("salaryBandId") REFERENCES "hrms_salary_bands"("id") ON DELETE SET NULL ON UPDATE CASCADE;
