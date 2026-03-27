import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { auditApi } from '@/app/api/audit'
import { usersApi } from '@/app/api/users'
import { appQueryKeys } from '@/app/query'
import { AuditAction } from '@/app/types'

export interface AdminUsersQueryParams {
  searchTerm: string
  page: number
  limit: number
}

export interface AdminAuditQueryParams {
  page: number
  limit: number
  action: AuditAction | ''
  entityType: string
  userId?: number
}

function buildUsersRequestParams(params: AdminUsersQueryParams) {
  const search = params.searchTerm.trim()
  return {
    search: search || undefined,
    page: params.page,
    limit: params.limit,
  }
}

function buildAuditRequestParams(params: AdminAuditQueryParams) {
  return {
    page: params.page,
    limit: params.limit,
    action: params.action || undefined,
    entityType: params.entityType || undefined,
    userId: params.userId ?? undefined,
  }
}

export function useAdminUsersQuery(params: AdminUsersQueryParams) {
  const requestParams = buildUsersRequestParams(params)

  return useQuery({
    queryKey: appQueryKeys.admin.users(requestParams),
    queryFn: ({ signal }) => usersApi.list(requestParams, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminAuditQuery(params: AdminAuditQueryParams) {
  const requestParams = buildAuditRequestParams(params)

  return useQuery({
    queryKey: appQueryKeys.admin.audit(requestParams),
    queryFn: ({ signal }) => auditApi.list(requestParams, { signal }),
    placeholderData: keepPreviousData,
  })
}
