import { api, buildQuery, type ApiRequestOptions } from './client'
import type { AuditLog, PaginatedResult, QueryParams } from '../types'

export const auditApi = {
  list(params: QueryParams = {}, options: ApiRequestOptions = {}): Promise<PaginatedResult<AuditLog>> {
    return api.get(`/audit-logs${buildQuery(params)}`, options)
  },
}
