import { createContext } from 'react'
import type { LoginDto, RegisterDto, User } from '../types'

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

const noopAsync = async () => undefined

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  login: noopAsync,
  register: noopAsync,
  logout: () => undefined,
  refreshUser: noopAsync,
})
