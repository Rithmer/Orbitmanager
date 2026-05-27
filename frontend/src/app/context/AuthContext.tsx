import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, ApiError } from '@/app/api/client'
import { authApi } from '@/app/api/auth'
import type { User, LoginDto, RegisterDto } from '@/app/types'
import { AccountRole } from '@/app/types'
import { AuthContext } from '@/app/context/auth-context'
import { clearLastBoardProjectId } from '@/app/utils/lastBoardProjectStorage'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    const rt = api.getRefreshToken()
    if (rt) {
      authApi.logout(rt).catch((err) => {
        console.warn('Logout API call failed, local session cleared:', err)
      })
    }
    api.clearTokens()
    clearLastBoardProjectId()
    setUser(null)
  }, [])

  useEffect(() => {
    api.setOnAuthExpired(logout)
  }, [logout])

  useEffect(() => {
    api.loadTokens()

    let isMounted = true
    const bootstrapAuth = async () => {
      if (api.isAuthenticated()) {
        try {
          const me = await authApi.me()
          if (isMounted) {
            setUser(me)
          }
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            api.clearTokens()
          }
        }
      }
      if (isMounted) {
        setLoading(false)
      }
    }

    void bootstrapAuth()
    return () => {
      isMounted = false
    }
  }, [])

  const login = useCallback(async (dto: LoginDto) => {
    const tokens = await authApi.login(dto)
    api.setTokens(tokens.accessToken, tokens.refreshToken)
    try {
      const me = await authApi.me()
      setUser(me)
    } catch (err) {
      api.clearTokens()
      throw err
    }
  }, [])

  const register = useCallback(async (dto: RegisterDto) => {
    const tokens = await authApi.register(dto)
    api.setTokens(tokens.accessToken, tokens.refreshToken)
    try {
      const me = await authApi.me()
      setUser(me)
    } catch (err) {
      api.clearTokens()
      throw err
    }
  }, [])

  const refreshUser = async () => {
    try {
      const me = await authApi.me()
      setUser(me)
    } catch {
      void 0
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
