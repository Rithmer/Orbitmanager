#!/bin/sh
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is required."
  exit 1
fi

echo "Applying database migrations..."
npx prisma migrate deploy --config ./prisma.config.ts
echo "Migrations applied."

SEED_COMMAND=${SEED_COMMAND:-npm run seed}

if [ "${AUTO_SEED:-false}" = "true" ]; then
  USER_COUNT=$(psql "$DATABASE_URL" -tAc 'SELECT COUNT(*) FROM "users"' | tr -d '[:space:]')
  if [ "$USER_COUNT" = "0" ]; then
    echo "Database is empty, running seed command: $SEED_COMMAND"
    sh -c "$SEED_COMMAND"
    echo "Seed completed."
  else
    echo "AUTO_SEED is enabled, but the database is not empty. Skipping seed."
  fi
else
  echo "AUTO_SEED is disabled, skipping seed."
fi

exec "$@"
