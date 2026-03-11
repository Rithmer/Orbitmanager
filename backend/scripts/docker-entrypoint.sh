#!/bin/sh
set -e

# Apply Prisma migrations if running in postgres mode
if [ "$STORAGE_MODE" = "postgres" ] && [ -n "$DATABASE_URL" ]; then
  echo "Applying database migrations..."
  npx prisma migrate deploy --config ./prisma/prisma.config.ts
  echo "Migrations applied."
fi

exec "$@"
