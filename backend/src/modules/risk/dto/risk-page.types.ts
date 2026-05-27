/**
 * Server-side page-ready DTOs for the Risks page.
 * These types extend the base risk DTOs additively.
 */

export interface RiskFactorDto {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

export interface AssigneeBreakdownDto {
  userId: number;
  userName: string;
  impactScore: number;
  confidence: number;
  note: string;
}

export interface RecommendedAssigneeDto {
  userId: number;
  fullName: string;
  profession: string;
  role: string;
  fitScore: number;
  reason: string;
}

export interface TaskInsightDto {
  taskId: number;
  taskName: string;
  predictedCompletionDate: string;
  delayProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendation: string;
  taskSuccessProbability: number;
  coordinationPenalty: number;
  assigneeBreakdown: AssigneeBreakdownDto[];
  recommendedAssignees: RecommendedAssigneeDto[];
}

export interface RecommendationDto {
  id: string;
  type: 'add_member' | 'swap_members' | 'rebalance_load';
  title: string;
  reason: string;
  taskId: number | null;
}

export interface RiskPageProjectDto {
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  tasksAtRisk: { taskId: number; taskName: string; delayProbability: number }[];
  summary: string;
  predictionSource: 'ml' | 'stub';
  successProbability: number;
  riskFactors: RiskFactorDto[];
  taskInsights: TaskInsightDto[];
  recommendations: RecommendationDto[];
}

export interface RiskPageTaskDto {
  predictedCompletionDate: string;
  delayProbability: number;
  riskLevel: 'low' | 'medium' | 'high';
  riskFactors: string[];
  recommendation: string;
  taskSuccessProbability: number;
  coordinationPenalty: number;
  assigneeBreakdown: AssigneeBreakdownDto[];
  recommendedAssignees: RecommendedAssigneeDto[];
}
