import { api, buildQuery, type ApiRequestOptions } from './client'
import type { RiskProjectOption } from '../features/risks'

export type RisksProjectRiskResponse = Record<number, {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  tasksAtRisk: Array<{ taskId: number; taskName: string; delayProbability: number }>
  summary: string
  predictionSource: 'ml' | 'stub'
  successProbability: number
  riskFactors: Array<{ id: string; label: string; severity: 'low' | 'medium' | 'high' }>
  taskInsights: Array<{
    taskId: number
    taskName: string
    predictedCompletionDate: string
    delayProbability: number
    riskLevel: 'low' | 'medium' | 'high'
    riskFactors: string[]
    recommendation: string
    taskSuccessProbability: number
    coordinationPenalty: number
    assigneeBreakdown: Array<{
      userId: number
      userName: string
      impactScore: number
      confidence: number
      note: string
    }>
    recommendedAssignees: Array<{
      userId: number
      fullName: string
      profession: string
      role: string
      fitScore: number
      reason: string
    }>
  }>
  recommendations: Array<{
    id: string
    type: 'add_member' | 'swap_members' | 'rebalance_load'
    title: string
    reason: string
    taskId: number | null
  }>
}>

export const risksApi = {
  getProjects(
    options: ApiRequestOptions = {},
  ): Promise<RiskProjectOption[]> {
    return api.get('/reports/projects', options)
  },

  getProjectRisks(
    params: { projectIds?: number[] } = {},
    options: ApiRequestOptions = {},
  ): Promise<RisksProjectRiskResponse> {
    const ids = params.projectIds?.join(',')
    return api.get(`/risks/projects${buildQuery({ projectIds: ids })}`, options)
  },
}
