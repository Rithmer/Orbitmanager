import { getPageSurfaceTokens } from '@/app/hooks/pageSurfaceTokens'

export function useBoardPageSurfaceTokens(isDark: boolean) {
  const base = getPageSurfaceTokens(isDark)
  return {
    ...base,
    columnBg: isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]',
  }
}
