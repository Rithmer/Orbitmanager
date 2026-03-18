import { TaskRiskInput } from '../risk.types';

interface TaskRiskSource {
  id: number;
  difficulty: number;
  deadline: string | Date;
  createdAt: string | Date;
  status: string;
  assigneeId: number | null;
}

export function buildTaskRiskInput(
  task: TaskRiskSource,
  statusChangesCount: number,
  assigneeLoad: number,
): TaskRiskInput {
  const now = new Date();
  const deadline = new Date(task.deadline);
  const created = new Date(task.createdAt);
  const daysSinceCreation = Math.floor(
    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24),
  );
  const daysUntilDeadline = Math.floor(
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
  );

  return {
    taskId: task.id,
    difficulty: task.difficulty,
    deadline: deadline.toISOString(),
    createdAt: created.toISOString(),
    status: task.status,
    assigneeCount: task.assigneeId ? 1 : 0,
    assigneeLoad,
    statusChangesCount,
    daysSinceCreation,
    daysUntilDeadline,
  };
}
