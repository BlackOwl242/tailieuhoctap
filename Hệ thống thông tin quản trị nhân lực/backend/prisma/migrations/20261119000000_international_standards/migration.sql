-- ============================================================================
-- Migration: International Standards Upgrade (Group A/B/C)
-- 1) MFA (RFC 6238 TOTP + hashed backup codes) columns on users
-- 2) Exact fixed-point DECIMAL(18,2) + ISO 4217 currency columns on financial tables
-- 3) Append-only database triggers + SHA-256 hash chain on audit_logs
-- Non-destructive forward migration preserving 100% of existing records.
-- ============================================================================

-- 1. MFA columns on users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "mfaSecretEnc" TEXT,
  ADD COLUMN IF NOT EXISTS "mfaBackupCodes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "mfaEnrolledAt" TIMESTAMP(3);

-- 2. Fixed-point Decimal(18,2) & ISO 4217 currency on monetary tables
ALTER TABLE "users"
  ALTER COLUMN "baseSalary" TYPE DECIMAL(18, 2)
  USING CASE WHEN "baseSalary" IS NULL THEN NULL ELSE ROUND("baseSalary"::numeric, 2) END;

ALTER TABLE "contracts"
  ALTER COLUMN "baseSalary" TYPE DECIMAL(18, 2) USING ROUND("baseSalary"::numeric, 2),
  ALTER COLUMN "insuranceSalary" TYPE DECIMAL(18, 2) USING CASE WHEN "insuranceSalary" IS NULL THEN NULL ELSE ROUND("insuranceSalary"::numeric, 2) END,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "payslips"
  ALTER COLUMN "baseSalary" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("baseSalary", 0)::numeric, 2),
  ALTER COLUMN "otAmount" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("otAmount", 0)::numeric, 2),
  ALTER COLUMN "allowance" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("allowance", 0)::numeric, 2),
  ALTER COLUMN "bonus" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("bonus", 0)::numeric, 2),
  ALTER COLUMN "insurance" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("insurance", 0)::numeric, 2),
  ALTER COLUMN "incomeTax" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("incomeTax", 0)::numeric, 2),
  ALTER COLUMN "otherDeduct" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("otherDeduct", 0)::numeric, 2),
  ALTER COLUMN "netSalary" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("netSalary", 0)::numeric, 2);

ALTER TABLE "job_requisitions"
  ALTER COLUMN "budgetMonthly" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("budgetMonthly", 0)::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "personnel_salary_histories"
  ALTER COLUMN "baseAmount" TYPE DECIMAL(18, 2)
  USING CASE WHEN "baseAmount" IS NULL THEN NULL ELSE ROUND("baseAmount"::numeric, 2) END;

ALTER TABLE "hrms_salary_bands"
  ALTER COLUMN "minSalary" TYPE DECIMAL(18, 2) USING ROUND("minSalary"::numeric, 2),
  ALTER COLUMN "midSalary" TYPE DECIMAL(18, 2) USING ROUND("midSalary"::numeric, 2),
  ALTER COLUMN "maxSalary" TYPE DECIMAL(18, 2) USING ROUND("maxSalary"::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_salary_components"
  ALTER COLUMN "defaultAmount" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("defaultAmount", 0)::numeric, 2);

ALTER TABLE "hrms_salary_structure_items"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("amount", 0)::numeric, 2);

ALTER TABLE "hrms_salary_structure_assignments"
  ALTER COLUMN "baseSalary" TYPE DECIMAL(18, 2) USING ROUND("baseSalary"::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_payroll_runs"
  ALTER COLUMN "totalGrossPay" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("totalGrossPay", 0)::numeric, 2),
  ALTER COLUMN "totalDeduction" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("totalDeduction", 0)::numeric, 2),
  ALTER COLUMN "totalNetPay" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("totalNetPay", 0)::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_payroll_slips"
  ALTER COLUMN "baseSalary" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("baseSalary", 0)::numeric, 2),
  ALTER COLUMN "grossPay" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("grossPay", 0)::numeric, 2),
  ALTER COLUMN "totalDeduction" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("totalDeduction", 0)::numeric, 2),
  ALTER COLUMN "netPay" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("netPay", 0)::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_job_offers"
  ALTER COLUMN "offeredSalary" TYPE DECIMAL(18, 2) USING ROUND("offeredSalary"::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_travel_requests"
  ALTER COLUMN "estimatedBudget" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("estimatedBudget", 0)::numeric, 2),
  ALTER COLUMN "advanceRefundDue" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("advanceRefundDue", 0)::numeric, 2),
  ALTER COLUMN "advanceRefundPaid" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("advanceRefundPaid", 0)::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_employee_advances"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 2) USING ROUND("amount"::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_expense_claims"
  ALTER COLUMN "totalAmount" TYPE DECIMAL(18, 2) USING ROUND("totalAmount"::numeric, 2),
  ALTER COLUMN "approvedAmount" TYPE DECIMAL(18, 2) USING CASE WHEN "approvedAmount" IS NULL THEN NULL ELSE ROUND("approvedAmount"::numeric, 2) END,
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_employee_loans"
  ALTER COLUMN "principalAmount" TYPE DECIMAL(18, 2) USING ROUND("principalAmount"::numeric, 2),
  ALTER COLUMN "monthlyEmi" TYPE DECIMAL(18, 2) USING ROUND("monthlyEmi"::numeric, 2),
  ALTER COLUMN "totalRepaid" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("totalRepaid", 0)::numeric, 2),
  ALTER COLUMN "remainingAmount" TYPE DECIMAL(18, 2) USING ROUND("remainingAmount"::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "hrms_asset_allocations"
  ALTER COLUMN "value" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("value", 0)::numeric, 2),
  ADD COLUMN IF NOT EXISTS "currency" TEXT NOT NULL DEFAULT 'VND';

ALTER TABLE "payroll_loan_deductions"
  ALTER COLUMN "amount" TYPE DECIMAL(18, 2) USING ROUND("amount"::numeric, 2);

ALTER TABLE "expense_settlements"
  ALTER COLUMN "advanceApplied" TYPE DECIMAL(18, 2) USING ROUND("advanceApplied"::numeric, 2),
  ALTER COLUMN "payableAmount" TYPE DECIMAL(18, 2) USING ROUND("payableAmount"::numeric, 2),
  ALTER COLUMN "advanceRefundDue" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("advanceRefundDue", 0)::numeric, 2),
  ALTER COLUMN "advanceRefundPaid" TYPE DECIMAL(18, 2) USING ROUND(COALESCE("advanceRefundPaid", 0)::numeric, 2);

ALTER TABLE "probation_reviews"
  ALTER COLUMN "contractSalary" TYPE DECIMAL(18, 2)
  USING CASE WHEN "contractSalary" IS NULL THEN NULL ELSE ROUND("contractSalary"::numeric, 2) END;

-- 3. SOX / ISO 27001 Append-Only Audit Log Triggers & SHA-256 Hash Chain
ALTER TABLE "audit_logs"
  ADD COLUMN IF NOT EXISTS "prevHash" TEXT,
  ADD COLUMN IF NOT EXISTS "entryHash" TEXT;

CREATE OR REPLACE FUNCTION audit_logs_prevent_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (SOX/ISO 27001 immutability enforced)';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_no_update_delete ON "audit_logs";
CREATE TRIGGER trg_audit_logs_no_update_delete
BEFORE UPDATE OR DELETE ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION audit_logs_prevent_mutation();

CREATE OR REPLACE FUNCTION audit_logs_chain_insert()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  last_hash TEXT;
  canonical_ts TEXT;
  canonical_payload TEXT;
BEGIN
  PERFORM pg_advisory_xact_lock(77412301);
  NEW."createdAt" := (timezone('UTC', clock_timestamp()))::timestamp(3);

  SELECT "entryHash"
    INTO last_hash
    FROM "audit_logs"
   WHERE "entryHash" IS NOT NULL
   ORDER BY "id" DESC
   LIMIT 1;

  NEW."prevHash" := COALESCE(last_hash, 'GENESIS');
  canonical_ts := to_char(NEW."createdAt", 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"');
  canonical_payload := NEW."prevHash"
    || '|' || COALESCE(NEW."actorId", '')
    || '|' || NEW."action"
    || '|' || NEW."entityType"
    || '|' || COALESCE(NEW."entityId", '')
    || '|' || COALESCE(NEW."requestId", '')
    || '|' || canonical_ts;
  NEW."entryHash" := encode(sha256(convert_to(canonical_payload, 'UTF8')), 'hex');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_chain_insert ON "audit_logs";
CREATE TRIGGER trg_audit_logs_chain_insert
BEFORE INSERT ON "audit_logs"
FOR EACH ROW
EXECUTE FUNCTION audit_logs_chain_insert();
