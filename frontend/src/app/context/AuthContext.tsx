import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api, ApiError } from '../api/client'
import { authApi } from '../api/auth'
import type { User, LoginDto, RegisterDto } from '../types'
import { AccountRole } from '../types'
import { clearLastBoardProjectId } from '../utils/lastBoardProjectStorage'

export interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (dto: LoginDto) => Promise<void>
  register: (dto: RegisterDto) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const logout = useCallback(() => {
    const rt = api.getRefreshToken()
    if (rt) {
      authApi.logout(rt).catch(() => {})
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
    const me = await authApi.me()
    setUser(me)
  }, [])

  const register = useCallback(async (dto: RegisterDto) => {
    const tokens = await authApi.register(dto)
    api.setTokens(tokens.accessToken, tokens.refreshToken)
    const me = await authApi.me()
    setUser(me)
  }, [])

  const refreshUser = async () => {
    try {
      const me = await authApi.me()
      setUser(me)
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
