import { Task } from '../../../domain/models/task.model';
import { TaskRiskInput } from '../../../domain/services/risk-assessment.interface';

export function buildTaskRiskInput(
  task: Task,
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
    deadline: task.deadline,
    createdAt: task.createdAt,
    status: task.status,
    assigneeCount: task.assigneeId ? 1 : 0,
    assigneeLoad,
    statusChangesCount,
    daysSinceCreation,
    daysUntilDeadline,
  };
}
