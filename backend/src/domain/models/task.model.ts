import { TaskStatus } from '../../common/enums/task-status.enum';

export interface Task {
  id: number;
  projectId: number;
  name: string;
  description: string;
  deadline: string;
  status: TaskStatus;
  difficulty: number;
  assigneeId: number | null;
  createdById: number;
  createdAt: string;
  updatedAt: string;
}
