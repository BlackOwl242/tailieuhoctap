-- ============================================================================
-- Migration: 20260825100000_personnel_comprehensive
-- Domain 9: Personnel Comprehensive Profiles, Standard Ranks & 8 History Processes
-- ============================================================================

-- Enums
CREATE TYPE "RewardDisciplineType" AS ENUM ('REWARD', 'DISCIPLINE');
CREATE TYPE "FamilyCategory" AS ENUM ('SELF', 'SPOUSE');
CREATE TYPE "AppraisalClassification" AS ENUM ('EXCELLENT', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY');

-- Table: personnel_ranks
CREATE TABLE "personnel_ranks" (
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "groupCode" TEXT NOT NULL,
    "field" TEXT,
    "totalSteps" INTEGER NOT NULL DEFAULT 9,
    "stepMonths" INTEGER NOT NULL DEFAULT 36,
    "coefficients" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_ranks_pkey" PRIMARY KEY ("code")
);

-- Table: personnel_comprehensive_profiles
CREATE TABLE "personnel_comprehensive_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "aliasName" TEXT,
    "gender" TEXT,
    "birthPlace" TEXT,
    "hometown" TEXT,
    "permanentAddress" TEXT,
    "currentAddress" TEXT,
    "idCardNo" TEXT,
    "idCardIssueDate" TIMESTAMP(3),
    "idCardIssuePlace" TEXT,
    "ethnicity" TEXT DEFAULT 'Kinh',
    "religion" TEXT DEFAULT 'Không',
    "familyOrigin" TEXT,
    "priorJob" TEXT,
    "recruitDate" TIMESTAMP(3),
    "recruitOrg" TEXT,
    "currentOrgDate" TIMESTAMP(3),
    "officialDate" TIMESTAMP(3),
    "govPosition" TEXT,
    "mainDuty" TEXT,
    "rankCode" TEXT,
    "salaryStep" INTEGER,
    "salaryCoefficient" DOUBLE PRECISION,
    "salaryStepDate" TIMESTAMP(3),
    "overGradePercent" DOUBLE PRECISION DEFAULT 0,
    "positionAllowance" DOUBLE PRECISION DEFAULT 0,
    "otherAllowance" DOUBLE PRECISION DEFAULT 0,
    "socialInsuranceNo" TEXT,
    "socialInsuranceDate" TIMESTAMP(3),
    "generalEducation" TEXT DEFAULT '12/12',
    "highestDegree" TEXT,
    "majorCode" TEXT,
    "majorName" TEXT,
    "academicTitle" TEXT,
    "academicTitleDate" TIMESTAMP(3),
    "politicalTheory" TEXT,
    "stateManagement" TEXT,
    "foreignLanguage" TEXT,
    "informaticsLevel" TEXT,
    "ethnicLanguage" TEXT,
    "unionJoinDate" TIMESTAMP(3),
    "partyJoinDate" TIMESTAMP(3),
    "partyOfficialDate" TIMESTAMP(3),
    "partyPosition" TEXT,
    "partyJoinPlace" TEXT,
    "enlistmentDate" TIMESTAMP(3),
    "dischargeDate" TIMESTAMP(3),
    "militaryRank" TEXT,
    "honorTitle" TEXT,
    "healthStatus" TEXT DEFAULT 'Tốt',
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "bloodType" TEXT,
    "woundedClass" TEXT,
    "policyFamily" TEXT,
    "strengths" TEXT,
    "longestJob" TEXT,
    "historyNotes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_comprehensive_profiles_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_salary_histories
CREATE TABLE "personnel_salary_histories" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "rankCode" TEXT,
    "step" INTEGER NOT NULL,
    "coefficient" DOUBLE PRECISION NOT NULL,
    "overGradeRate" DOUBLE PRECISION DEFAULT 0,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "decisionNo" TEXT,
    "decisionDate" TIMESTAMP(3),
    "signer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_salary_histories_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_appointments
CREATE TABLE "personnel_appointments" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "positionTitle" TEXT NOT NULL,
    "orgUnitName" TEXT NOT NULL,
    "departmentName" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3),
    "decisionNo" TEXT,
    "decisionDate" TIMESTAMP(3),
    "signer" TEXT,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_appointments_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_educations
CREATE TABLE "personnel_educations" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "schoolName" TEXT NOT NULL,
    "majorName" TEXT NOT NULL,
    "degreeName" TEXT NOT NULL,
    "studyForm" TEXT NOT NULL DEFAULT 'Chính quy',
    "fromDate" TIMESTAMP(3),
    "toDate" TIMESTAMP(3),
    "graduationYear" INTEGER,
    "ranking" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_educations_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_work_histories
CREATE TABLE "personnel_work_histories" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "position" TEXT NOT NULL,
    "unitName" TEXT NOT NULL,
    "departmentName" TEXT,
    "referencePerson" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_work_histories_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_reward_disciplines
CREATE TABLE "personnel_reward_disciplines" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "type" "RewardDisciplineType" NOT NULL,
    "title" TEXT NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "decisionNo" TEXT,
    "issuingAuthority" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_reward_disciplines_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_family_relations
CREATE TABLE "personnel_family_relations" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "category" "FamilyCategory" NOT NULL DEFAULT 'SELF',
    "relationType" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_family_relations_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_appraisals
CREATE TABLE "personnel_appraisals" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "classification" "AppraisalClassification" NOT NULL,
    "comment" TEXT,
    "decisionNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_appraisals_pkey" PRIMARY KEY ("id")
);

-- Table: personnel_social_activities
CREATE TABLE "personnel_social_activities" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "organizationName" TEXT NOT NULL,
    "positionTitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personnel_social_activities_pkey" PRIMARY KEY ("id")
);

-- Indexes & Keys
CREATE INDEX "personnel_ranks_groupCode_idx" ON "personnel_ranks"("groupCode");
CREATE UNIQUE INDEX "personnel_comprehensive_profiles_userId_key" ON "personnel_comprehensive_profiles"("userId");
CREATE INDEX "personnel_comprehensive_profiles_rankCode_idx" ON "personnel_comprehensive_profiles"("rankCode");
CREATE INDEX "personnel_salary_histories_profileId_idx" ON "personnel_salary_histories"("profileId");
CREATE INDEX "personnel_appointments_profileId_idx" ON "personnel_appointments"("profileId");
CREATE INDEX "personnel_educations_profileId_idx" ON "personnel_educations"("profileId");
CREATE INDEX "personnel_work_histories_profileId_idx" ON "personnel_work_histories"("profileId");
CREATE INDEX "personnel_reward_disciplines_profileId_type_idx" ON "personnel_reward_disciplines"("profileId", "type");
CREATE INDEX "personnel_family_relations_profileId_category_idx" ON "personnel_family_relations"("profileId", "category");
CREATE INDEX "personnel_appraisals_profileId_year_idx" ON "personnel_appraisals"("profileId", "year");
CREATE INDEX "personnel_social_activities_profileId_idx" ON "personnel_social_activities"("profileId");

-- Foreign Keys
ALTER TABLE "personnel_comprehensive_profiles" ADD CONSTRAINT "personnel_comprehensive_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_comprehensive_profiles" ADD CONSTRAINT "personnel_comprehensive_profiles_rankCode_fkey" FOREIGN KEY ("rankCode") REFERENCES "personnel_ranks"("code") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "personnel_salary_histories" ADD CONSTRAINT "personnel_salary_histories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_salary_histories" ADD CONSTRAINT "personnel_salary_histories_rankCode_fkey" FOREIGN KEY ("rankCode") REFERENCES "personnel_ranks"("code") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "personnel_appointments" ADD CONSTRAINT "personnel_appointments_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_educations" ADD CONSTRAINT "personnel_educations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_work_histories" ADD CONSTRAINT "personnel_work_histories_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_reward_disciplines" ADD CONSTRAINT "personnel_reward_disciplines_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_family_relations" ADD CONSTRAINT "personnel_family_relations_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_appraisals" ADD CONSTRAINT "personnel_appraisals_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "personnel_social_activities" ADD CONSTRAINT "personnel_social_activities_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "personnel_comprehensive_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
