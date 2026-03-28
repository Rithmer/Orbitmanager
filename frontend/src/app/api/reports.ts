import { api, buildQuery, type ApiRequestOptions } from '@/app/api/client'
import type { ReportsAccessibleProject, ReportsSummaryResponse } from '@/app/features/reports/types'

export const reportsApi = {
  getSummary(
    params: { projectId?: number } = {},
    options: ApiRequestOptions = {},
  ): Promise<ReportsSummaryResponse> {
    return api.get(`/reports/summary${buildQuery({ projectId: params.projectId })}`, options)
  },

  getProjects(
    options: ApiRequestOptions = {},
  ): Promise<ReportsAccessibleProject[]> {
    return api.get('/reports/projects', options)
  },
}
