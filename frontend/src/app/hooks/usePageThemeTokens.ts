import { useMemo } from 'react'
import { useTheme } from '@/app/context/useTheme'
import { getPageSurfaceTokens } from '@/app/hooks/pageSurfaceTokens'

export function usePageThemeTokens() {
  const { isDark } = useTheme()

  return useMemo(() => ({ isDark, ...getPageSurfaceTokens(isDark) }), [isDark])
}
