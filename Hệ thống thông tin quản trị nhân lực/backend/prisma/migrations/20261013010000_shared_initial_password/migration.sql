-- New user accounts use the configured shared initial password directly.
ALTER TABLE "users" ALTER COLUMN "mustChangePassword" SET DEFAULT false;
