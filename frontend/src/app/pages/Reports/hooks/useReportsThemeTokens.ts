import { getPageSurfaceTokens } from '@/app/hooks/pageSurfaceTokens'

export function useReportsThemeTokens(isDark: boolean) {
  const { textSecondary, cardBg, cardBorder } = getPageSurfaceTokens(isDark)
  return {
    textSecondary,
    cardBg,
    cardBorder,
    gridColor: isDark ? '#313d4f' : '#f0f0f0',
    axisColor: isDark ? '#94a3b8' : '#9ca3af',
    tooltipStyle: {
      backgroundColor: isDark ? '#273142' : '#fff',
      border: `1px solid ${isDark ? '#313d4f' : '#e8e8e8'}`,
      borderRadius: '8px',
      color: isDark ? '#f4f3f2' : '#202224',
      fontSize: '12px',
    } as const,
  }
}

export type ReportsThemeTokens = ReturnType<typeof useReportsThemeTokens>
