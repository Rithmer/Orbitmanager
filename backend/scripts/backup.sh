#!/usr/bin/env bash
# в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ
# backup.sh вЂ” Р РµР·РµСЂРІРЅРѕРµ РєРѕРїРёСЂРѕРІР°РЅРёРµ РґР°РЅРЅС‹С…
# РџРѕРґРґРµСЂР¶РёРІР°РµС‚ JSON-С„Р°Р№Р»С‹ Рё PostgreSQL (pg_dump)
#
# РСЃРїРѕР»СЊР·РѕРІР°РЅРёРµ:
#   ./scripts/backup.sh            # Р±СЌРєР°Рї JSON
#   ./scripts/backup.sh --postgres # Р±СЌРєР°Рї PostgreSQL
#   ./scripts/backup.sh --restore <dir>  # РІРѕСЃСЃС‚Р°РЅРѕРІР»РµРЅРёРµ JSON
# в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$PROJECT_DIR/data"
BACKUP_ROOT="$DATA_DIR/backups"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# в”Ђв”Ђ JSON Backup в”Ђв”Ђ
backup_json() {
  local BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"
  mkdir -p "$BACKUP_DIR"

  echo "Creating JSON backup в†’ $BACKUP_DIR"

  for f in "$DATA_DIR"/*.json; do
    [ -f "$f" ] && cp "$f" "$BACKUP_DIR/"
  done

  echo "Backup completed: $BACKUP_DIR"
  rotate_backups
}

# в”Ђв”Ђ PostgreSQL Backup в”Ђв”Ђ
backup_postgres() {
  local BACKUP_FILE="$BACKUP_ROOT/pg_${TIMESTAMP}.sql.gz"
  mkdir -p "$BACKUP_ROOT"

  DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/task_manager}"
  echo "Creating PostgreSQL backup в†’ $BACKUP_FILE"

  pg_dump "$DB_URL" | gzip > "$BACKUP_FILE"
  echo "PostgreSQL backup completed: $BACKUP_FILE"
}

# в”Ђв”Ђ Restore JSON в”Ђв”Ђ
restore_json() {
  local RESTORE_DIR="$1"

  if [ ! -d "$RESTORE_DIR" ]; then
    echo "Error: directory not found: $RESTORE_DIR"
    exit 1
  fi

  echo "Restoring JSON from $RESTORE_DIR в†’ $DATA_DIR"

  for f in "$RESTORE_DIR"/*.json; do
    [ -f "$f" ] && cp "$f" "$DATA_DIR/"
  done

  echo "Restore completed."
}

# в”Ђв”Ђ Rotation: 7 daily + 4 weekly в”Ђв”Ђ
rotate_backups() {
  if [ ! -d "$BACKUP_ROOT" ]; then
    return
  fi

  echo "Rotating old backups..."

  # Keep last 7 daily backups (directories), remove older ones
  local dirs
  dirs=$(find "$BACKUP_ROOT" -maxdepth 1 -mindepth 1 -type d | sort -r)
  local count=0
  for d in $dirs; do
    count=$((count + 1))
    if [ $count -gt 7 ]; then
      echo "  Removing old backup: $(basename "$d")"
      rm -rf "$d"
    fi
  done

  # Keep last 4 weekly pg dumps, remove older ones
  local pgfiles
  pgfiles=$(find "$BACKUP_ROOT" -maxdepth 1 -name "pg_*.sql.gz" | sort -r)
  count=0
  for f in $pgfiles; do
    count=$((count + 1))
    if [ $count -gt 4 ]; then
      echo "  Removing old pg dump: $(basename "$f")"
      rm -f "$f"
    fi
  done
}

# в”Ђв”Ђ Main в”Ђв”Ђ
case "${1:-}" in
  --postgres)
    backup_postgres
    ;;
  --restore)
    if [ -z "${2:-}" ]; then
      echo "Usage: $0 --restore <backup_directory>"
      exit 1
    fi
    restore_json "$2"
    ;;
  *)
    backup_json
    ;;
esac
