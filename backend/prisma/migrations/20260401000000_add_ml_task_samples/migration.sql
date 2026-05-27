-- CreateTable
CREATE TABLE "ml_task_samples" (
    "id" SERIAL NOT NULL,
    "task_id" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "assignee_count" INTEGER NOT NULL,
    "assignee_load" INTEGER NOT NULL,
    "status_changes_count" INTEGER NOT NULL,
    "days_since_creation" INTEGER NOT NULL,
    "days_until_deadline" INTEGER NOT NULL,
    "delay_probability" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "ml_task_samples_pkey" PRIMARY KEY ("id")
);
