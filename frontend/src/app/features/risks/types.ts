import type { RiskLevel } from '../../types'

export interface RiskProjectOption {
  id: number
  name: string
  teamId?: number
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

export interface RiskTaskInsight {
  taskId: number
  taskName: string
  taskSuccessProbability: number
  coordinationPenalty: number
  assigneeBreakdown: RiskAssigneeContribution[]
  reason?: string
}

export interface RiskRecommendation {
  id: string
  type: 'add_member' | 'swap_members' | 'rebalance_load'
  title: string
  reason: string
}

export interface RisksProjectCard {
  projectId: number
  projectName: string
  successProbability: number
  riskLevel: RiskLevel
  riskFactors: RiskFactor[]
  taskInsights: RiskTaskInsight[]
  recommendations: RiskRecommendation[]
}
