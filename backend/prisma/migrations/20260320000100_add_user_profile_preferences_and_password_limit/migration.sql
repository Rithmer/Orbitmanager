ALTER TABLE "users"
ADD COLUMN "ai_hints_enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "last_password_changed_at" TIMESTAMP(3);
