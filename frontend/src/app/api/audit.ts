import { api, buildQuery } from './client'
import type { AuditLog, PaginatedResult, QueryParams } from '../types'

export const auditApi = {
  list(params: QueryParams = {}): Promise<PaginatedResult<AuditLog>> {
    return api.get(`/audit-logs${buildQuery(params)}`)
  },
}
