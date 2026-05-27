import { api, buildQuery, type ApiRequestOptions } from '@/app/api/client'
import type {
  RiskProjectOption,
  RiskFactor,
  RiskTaskInsight,
  RiskRecommendation,
} from '@/app/features/risks'

export interface RisksProjectRiskItem {
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high'
  tasksAtRisk: Array<{ taskId: number; taskName: string; delayProbability: number }>
  summary: string
  predictionSource: 'ml' | 'stub'
  successProbability: number
  riskFactors: RiskFactor[]
  taskInsights: RiskTaskInsight[]
  recommendations: RiskRecommendation[]
}

export type RisksProjectRiskResponse = Record<number, RisksProjectRiskItem>

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
