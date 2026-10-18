#!/bin/sh
# Entrypoint: tự động áp dụng migration rồi mới khởi động API.
# Seed chạy đúng MỘT LẦN khi DB còn trống (SEED_ON_FIRST_RUN=true).
set -e

echo "[entrypoint] applying database migrations..."
npx prisma migrate deploy

if [ "${SEED_ON_FIRST_RUN}" = "true" ]; then
  echo "[entrypoint] seeding demo data if database is empty..."
  node prisma/seed.cjs
  echo "[entrypoint] syncing demo role accounts..."
  node scripts/seed-demo-role-accounts.cjs
fi

if [ "${DEMO_CONTRACT_SYNC}" = "true" ]; then
  echo "[entrypoint] syncing active demo employment contracts and electronic copies..."
  node prisma/seed-demo-contracts.cjs
fi

echo "[entrypoint] starting API..."
exec node dist/main.js
