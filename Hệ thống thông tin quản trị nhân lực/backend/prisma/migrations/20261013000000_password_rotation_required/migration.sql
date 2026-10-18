-- Existing accounts are checked against the initialization credentials in a
-- one-time operational step. Keep existing rows false until that check runs;
-- new accounts are required to replace their initialization password.
ALTER TABLE "users"
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "users"
  ALTER COLUMN "mustChangePassword" SET DEFAULT true;
