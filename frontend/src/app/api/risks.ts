import { api, buildQuery, type ApiRequestOptions } from './client'
import type { RiskProjectOption } from '../features/risks'
import type { RiskLevel } from '../types'

export type RisksProjectRiskResponse = Record<
  number,
  {
    riskScore: number
    riskLevel: RiskLevel
    tasksAtRisk: Array<{ taskId: number; taskName: string; delayProbability: number }>
    summary: string
  }
>

export type RisksTaskRiskResponse = Record<
  number,
  {
    predictedCompletionDate: string
    delayProbability: number
    riskLevel: RiskLevel
    riskFactors?: string[]
    recommendation?: string
  }
>

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

  getProjectTaskRisks(
    projectId: number,
    options: ApiRequestOptions = {},
  ): Promise<RisksTaskRiskResponse> {
    return api.get(`/projects/${projectId}/tasks-risk`, options)
  },
}
