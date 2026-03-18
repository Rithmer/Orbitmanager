#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

echo "Applying database migrations..."
npx prisma migrate deploy --config ./prisma/prisma.config.ts
echo "Migrations applied."

if [ "${AUTO_SEED:-true}" = "true" ]; then
  echo "Running database seed..."
  npm run seed
  echo "Seed completed."
else
  echo "AUTO_SEED is disabled, skipping seed."
fi

exec "$@"
