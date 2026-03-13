#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
BACKUP_ROOT="${BACKUP_ROOT:-$PROJECT_DIR/backups}"
DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/task_manager}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

backup_postgres() {
  local backup_file="$BACKUP_ROOT/pg_${TIMESTAMP}.sql.gz"
  mkdir -p "$BACKUP_ROOT"

  echo "Creating PostgreSQL backup at $backup_file"
  pg_dump "$DATABASE_URL" | gzip > "$backup_file"
  echo "Backup completed: $backup_file"
  rotate_backups
}

restore_postgres() {
  local dump_file="$1"

  if [ ! -f "$dump_file" ]; then
    echo "Error: dump file not found: $dump_file"
    exit 1
  fi

  echo "Restoring PostgreSQL dump from $dump_file"
  if [[ "$dump_file" == *.gz ]]; then
    gzip -cd "$dump_file" | psql "$DATABASE_URL"
  else
    psql "$DATABASE_URL" < "$dump_file"
  fi
  echo "Restore completed."
}

rotate_backups() {
  if [ ! -d "$BACKUP_ROOT" ]; then
    return
  fi

  local files
  files=$(find "$BACKUP_ROOT" -maxdepth 1 -name "pg_*.sql.gz" | sort -r)
  local count=0

  for file in $files; do
    count=$((count + 1))
    if [ $count -gt 7 ]; then
      echo "Removing old backup: $(basename "$file")"
      rm -f "$file"
    fi
  done
}

case "${1:-}" in
  --restore)
    if [ -z "${2:-}" ]; then
      echo "Usage: $0 --restore <dump_file>"
      exit 1
    fi
    restore_postgres "$2"
    ;;
  "")
    backup_postgres
    ;;
  *)
    echo "Usage: $0 [--restore <dump_file>]"
    exit 1
    ;;
esac
