import { api, buildQuery, type ApiRequestOptions } from '@/app/api/client'
import type { User, PaginatedResult, QueryParams, UserAccountStatus } from '@/app/types'

export const usersApi = {
  list(params: QueryParams = {}, options: ApiRequestOptions = {}): Promise<PaginatedResult<User>> {
    return api.get(`/users${buildQuery(params)}`, options)
  },

  getById(id: number, options: ApiRequestOptions = {}): Promise<User> {
    return api.get(`/users/${id}`, options)
  },

  create(dto: {
    login: string
    password: string
    fullName: string
    profession?: string
    accountRole?: string
  }): Promise<User> {
    return api.post('/users', dto)
  },

  update(
    id: number,
    dto: Partial<{
      fullName: string
      profession: string
      accountRole: string
      accountStatus: UserAccountStatus
      avatarUrl: string | null
    }>,
  ): Promise<User> {
    return api.patch(`/users/${id}`, dto)
  },

  updateMe(dto: { fullName?: string; profession?: string; avatarUrl?: string | null }): Promise<User> {
    return api.patch('/users/me', dto)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/users/${id}`)
  },
}
