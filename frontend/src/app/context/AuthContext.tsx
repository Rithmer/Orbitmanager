import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react'
import { api, ApiError } from '../api/client'
import { authApi } from '../api/auth'
import type { User, LoginDto, RegisterDto } from '../types'
import { AccountRole } from '../types'

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
    api.clearTokens()
    setUser(null)
  }, [])

  useEffect(() => {
    api.setOnAuthExpired(logout)
  }, [logout])

  useEffect(() => {
    api.loadTokens()
    if (api.isAuthenticated()) {
      authApi
        .me()
        .then(setUser)
        .catch((err) => {
          if (err instanceof ApiError && err.status === 401) {
            api.clearTokens()
          }
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (dto: LoginDto) => {
    const tokens = await authApi.login(dto)
    api.setTokens(tokens.accessToken, tokens.refreshToken)
    const me = await authApi.me()
    setUser(me)
  }

  const register = async (dto: RegisterDto) => {
    const tokens = await authApi.register(dto)
    api.setTokens(tokens.accessToken, tokens.refreshToken)
    const me = await authApi.me()
    setUser(me)
  }

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

export function useAuth() {
  return useContext(AuthContext)
}
