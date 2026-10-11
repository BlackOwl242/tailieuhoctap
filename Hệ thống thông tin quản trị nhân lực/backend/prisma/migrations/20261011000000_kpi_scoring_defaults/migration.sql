-- New KPI cycles use manager-scored results; preserve existing rows and legacy review data.
ALTER TABLE "hrms_appraisal_cycles"
    ALTER COLUMN "selfWeight" SET DEFAULT 0,
    ALTER COLUMN "peerWeight" SET DEFAULT 0,
    ALTER COLUMN "managerWeight" SET DEFAULT 100,
    ALTER COLUMN "subordinateWeight" SET DEFAULT 0;
