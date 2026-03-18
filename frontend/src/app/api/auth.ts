import { api } from './client'
import type { AuthTokens, LoginDto, RegisterDto, User } from '../types'

export const authApi = {
  login(dto: LoginDto): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/login', dto)
  },

  register(dto: RegisterDto): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/register', dto)
  },

  refresh(refreshToken: string): Promise<AuthTokens> {
    return api.post<AuthTokens>('/auth/refresh', { refreshToken })
  },

  me(): Promise<User> {
    return api.get<User>('/auth/me')
  },
}
