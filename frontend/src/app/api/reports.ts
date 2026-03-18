import { api, type ApiRequestOptions } from './client'
import type { ReportsSummaryResponse } from '../features/reports/types'

export const reportsApi = {
  getSummary(options: ApiRequestOptions = {}): Promise<ReportsSummaryResponse> {
    return api.get('/reports/summary', options)
  },
}
