import { api, type ApiRequestOptions } from '@/app/api/client'
import type { DashboardSummaryResponse } from '@/app/features/dashboard/types'

export const dashboardApi = {
  getSummary(options: ApiRequestOptions = {}): Promise<DashboardSummaryResponse> {
    return api.get('/dashboard/summary', options)
  },
}
