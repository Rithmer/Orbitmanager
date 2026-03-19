CREATE INDEX "teams_created_by_id_idx" ON "teams"("created_by_id");

CREATE INDEX "team_members_team_id_idx" ON "team_members"("team_id");

CREATE INDEX "projects_team_id_idx" ON "projects"("team_id");

CREATE INDEX "project_members_user_id_idx" ON "project_members"("user_id");

CREATE INDEX "tasks_project_id_idx" ON "tasks"("project_id");
CREATE INDEX "tasks_assignee_id_idx" ON "tasks"("assignee_id");

CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

CREATE INDEX "calendar_events_user_id_start_date_idx" ON "calendar_events"("user_id", "start_date");
