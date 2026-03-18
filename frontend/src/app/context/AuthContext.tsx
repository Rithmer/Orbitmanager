import {
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../api/client'
import { authApi } from '../api/auth'
import { appQueryKeys } from '../query'
import { AccountRole } from '../types'
import type { LoginDto, RegisterDto } from '../types'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [hasAuthTokens, setHasAuthTokens] = useState(() => {
    api.loadTokens()
    return api.isAuthenticated()
  })

  const fetchCurrentUser = useCallback((signal?: AbortSignal) => {
    return authApi.me({ signal })
  }, [])

  const currentUserQuery = useQuery({
    queryKey: appQueryKeys.auth.me,
    queryFn: ({ signal }) => fetchCurrentUser(signal),
    enabled: hasAuthTokens,
    retry: false,
    staleTime: 5 * 60_000,
  })

  const user = currentUserQuery.data ?? null
  const loading = hasAuthTokens && currentUserQuery.isPending && !currentUserQuery.data

  const logout = useCallback(() => {
    api.clearTokens()
    setHasAuthTokens(false)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    api.setOnAuthExpired(logout)
  }, [logout])

  const login = async (dto: LoginDto) => {
    const tokens = await authApi.login(dto)
    try {
      api.setTokens(tokens.accessToken, tokens.refreshToken)
      const me = await fetchCurrentUser()
      queryClient.setQueryData(appQueryKeys.auth.me, me)
      setHasAuthTokens(true)
    } catch (error) {
      api.clearTokens()
      setHasAuthTokens(false)
      queryClient.clear()
      throw error
    }
  }

  const register = async (dto: RegisterDto) => {
    const tokens = await authApi.register(dto)
    try {
      api.setTokens(tokens.accessToken, tokens.refreshToken)
      const me = await fetchCurrentUser()
      queryClient.setQueryData(appQueryKeys.auth.me, me)
      setHasAuthTokens(true)
    } catch (error) {
      api.clearTokens()
      setHasAuthTokens(false)
      queryClient.clear()
      throw error
    }
  }

  const refreshUser = async () => {
    try {
      const me = await fetchCurrentUser()
      queryClient.setQueryData(appQueryKeys.auth.me, me)
    } catch {
      /* ignore */
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.accountRole === AccountRole.ADMIN,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
