export interface TaskRiskInput {
  taskId: number;
  difficulty: number;
  deadline: string;
  createdAt: string;
  status: string;
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
