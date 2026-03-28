import { useContext } from 'react'
import { AuthContext } from '@/app/context/auth-context'

export function useAuth() {
  return useContext(AuthContext)
}
