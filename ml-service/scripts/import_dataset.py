"""
Import tasks_dataset.csv into the ml_task_samples PostgreSQL table.

Usage:
    DATABASE_URL=postgresql://postgres:postgres@localhost:5433/task_manager \
        python ml-service/scripts/import_dataset.py

The script is idempotent: it truncates the table before inserting.
"""
import os
import sys
import csv
import logging
from pathlib import Path

import psycopg2
from psycopg2.extras import execute_values

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATASET_PATH = Path(__file__).parent.parent / "data" / "tasks_dataset.csv"

DATABASE_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:postgres@localhost:5433/task_manager",
)


def main() -> None:
    if not DATASET_PATH.exists():
        logger.error("Dataset not found: %s", DATASET_PATH)
        sys.exit(1)

    rows = []
    with open(DATASET_PATH, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append((
                int(row["taskId"]),
                int(row["difficulty"]),
                row["deadline"],
                row["createdAt"],
                row["status"],
                int(row["assigneeCount"]),
                int(row["assigneeLoad"]),
                int(row["statusChangesCount"]),
                int(row["daysSinceCreation"]),
                int(row["daysUntilDeadline"]),
                float(row["delay_probability"]),
            ))

    logger.info("Read %d rows from %s", len(rows), DATASET_PATH)

    conn = psycopg2.connect(DATABASE_URL)
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("TRUNCATE TABLE ml_task_samples RESTART IDENTITY")
                execute_values(
                    cur,
                    """
                    INSERT INTO ml_task_samples (
                        task_id, difficulty, deadline, created_at, status,
                        assignee_count, assignee_load, status_changes_count,
                        days_since_creation, days_until_deadline, delay_probability
                    ) VALUES %s
                    """,
                    rows,
                )
                logger.info("Inserted %d rows into ml_task_samples", len(rows))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
