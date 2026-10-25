ALTER TABLE "hrms_payroll_runs" ADD COLUMN "attendanceVersion" INTEGER;

-- Recover only the version recorded when payroll was calculated; never copy today's version.
UPDATE "hrms_payroll_runs" r SET "attendanceVersion" = (a."afterData"->>'attendanceVersion')::INTEGER
FROM (
  SELECT DISTINCT ON ("entityId") "entityId", "afterData"
  FROM "audit_logs"
  WHERE "action" = 'PAYROLL_CALCULATED'
    AND "afterData"->>'attendanceVersion' ~ '^[0-9]{1,9}$'
  ORDER BY "entityId", "createdAt" DESC
) a
WHERE r."id" = a."entityId" AND r."attendancePeriodId" = a."afterData"->>'attendancePeriodId';
