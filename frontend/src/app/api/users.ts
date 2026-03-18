import { api, buildQuery } from './client'
import type { User, PaginatedResult, QueryParams } from '../types'

export const usersApi = {
  list(params: QueryParams = {}): Promise<PaginatedResult<User>> {
    return api.get(`/users${buildQuery(params)}`)
  },

  getById(id: number): Promise<User> {
    return api.get(`/users/${id}`)
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
      accountStatus: string
    }>,
  ): Promise<User> {
    return api.patch(`/users/${id}`, dto)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/users/${id}`)
  },
}
