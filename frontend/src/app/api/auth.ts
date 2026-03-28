import { api, type ApiRequestOptions } from '@/app/api/client'
import type { AuthTokens, LoginDto, RegisterDto, User } from '@/app/types'

type ChangePasswordDto = {
  currentPassword: string
  newPassword: string
}

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

  logout(refreshToken: string): Promise<void> {
    return api.post<void>('/auth/logout', { refreshToken })
  },

  me(options: ApiRequestOptions = {}): Promise<User> {
    return api.get<User>('/auth/me', options)
  },

  async changePassword(dto: ChangePasswordDto): Promise<void> {
    await api.post('/auth/change-password', dto)
  },
}
