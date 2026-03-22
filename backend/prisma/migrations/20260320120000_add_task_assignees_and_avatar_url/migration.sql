-- Migration: add task_assignees table and avatar_url to users
-- Replaces single assignee_id on tasks with many-to-many task_assignees table

-- Step 1: Add avatar_url to users
ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;

-- Step 2: Create task_assignees table
CREATE TABLE "task_assignees" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "task_assignees_pkey" PRIMARY KEY ("id")
);

-- Step 3: Migrate existing assignee data
INSERT INTO "task_assignees" ("task_id", "user_id")
SELECT "id", "assignee_id"
FROM "tasks"
WHERE "assignee_id" IS NOT NULL;

-- Step 4: Add foreign keys to task_assignees
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_fkey"
    FOREIGN KEY ("task_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Add unique constraint and index
CREATE UNIQUE INDEX "task_assignees_task_id_user_id_key" ON "task_assignees"("task_id", "user_id");
CREATE INDEX "task_assignees_user_id_idx" ON "task_assignees"("user_id");

-- Step 6: Drop old assignee_id column from tasks (data already migrated)
ALTER TABLE "tasks" DROP COLUMN "assignee_id";
