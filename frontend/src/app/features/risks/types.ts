import type { RiskLevel } from '../../types'

export interface RiskProjectOption {
  id: number
  name: string
  teamId: number
}

export interface RiskFactor {
  id: string
  label: string
  severity: 'low' | 'medium' | 'high'
}

export interface RiskAssigneeContribution {
  userId: number
  userName: string
  impactScore: number
  confidence: number
  note?: string
}

export interface RiskRecommendedAssignee {
  userId: number
  fullName: string
  profession: string
  role: string
  fitScore: number
  reason: string
}

export interface RiskTaskInsight {
  taskId: number
  taskName: string
  predictedCompletionDate: string
  delayProbability: number
  riskLevel: 'low' | 'medium' | 'high'
  riskFactors: string[]
  recommendation: string
  taskSuccessProbability: number
  coordinationPenalty: number
  assigneeBreakdown: RiskAssigneeContribution[]
  recommendedAssignees: RiskRecommendedAssignee[]
}

export interface RiskRecommendation {
  id: string
  type: 'add_member' | 'swap_members' | 'rebalance_load'
  title: string
  reason: string
  taskId?: number | null
}

export interface RisksProjectCard {
  projectId: number
  projectName: string
  successProbability: number
  riskLevel: RiskLevel
  riskFactors: RiskFactor[]
  taskInsights: RiskTaskInsight[]
  recommendations: RiskRecommendation[]
  predictionSource: 'ml' | 'stub'
}
