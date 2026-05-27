#!/bin/bash

cd "$(dirname "$0")/.." || exit 1

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

BACKUP_DIR="./backend/backups"
DB_CONTAINER="postgres"
DB_USER="${DB_USERNAME:-postgres}"
DB_NAME="${DB_NAME:-task_manager}"
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_daily.sql"

mkdir -p "$BACKUP_DIR"

while true; do
  echo "Запуск бэкапа: $(date)"

  docker compose exec -T "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

  if [ $? -eq 0 ]; then
    gzip -f "$BACKUP_FILE"
    echo "Бэкап успешно обновлен"
  else
    rm -f "$BACKUP_FILE"
    echo "Ошибка бэкапа"
  fi

  sleep 86400
done
