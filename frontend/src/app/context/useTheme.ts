import { useContext } from 'react'
import { ThemeContext } from '@/app/context/theme-context'

export function useTheme() {
  return useContext(ThemeContext)
}
