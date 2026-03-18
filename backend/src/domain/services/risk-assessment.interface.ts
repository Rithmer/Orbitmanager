import type { TaskStatus } from '@/common/enums/task-status.enum';

export interface TaskRiskInput {
  taskId: number;
  difficulty: number;
  deadline: string;
  createdAt: string;
  status: TaskStatus;
  assigneeCount: number;
  assigneeLoad: number;
  statusChangesCount: number;
  daysSinceCreation: number;
  daysUntilDeadline: number;
}

export interface TaskRiskOutput {
  predictedCompletionDate: string;
  delayProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendation: string;
}

export interface ProjectRiskOutput {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  tasksAtRisk: { taskId: number; taskName: string; delayProbability: number }[];
  summary: string;
}

export interface IRiskAssessmentService {
  assessTask(input: TaskRiskInput): Promise<TaskRiskOutput>;
  assessProject(projectId: number): Promise<ProjectRiskOutput>;
  assessProjectsBatch(
    projectIds: number[],
  ): Promise<Record<number, ProjectRiskOutput>>;
  loadModel?(): Promise<void>;
}

export const RISK_ASSESSMENT_SERVICE = Symbol('RISK_ASSESSMENT_SERVICE');
