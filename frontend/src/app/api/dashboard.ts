import { api, type ApiRequestOptions } from './client'
import type { DashboardSummaryResponse } from '../features/dashboard/types'

export const dashboardApi = {
  getSummary(options: ApiRequestOptions = {}): Promise<DashboardSummaryResponse> {
    return api.get('/dashboard/summary', options)
  },
}
