import { useMemo } from 'react'
import { TaskStatus } from '@/app/types'
import { usePageThemeTokens } from '@/app/hooks/usePageThemeTokens'

export function useDashboardThemeTokens() {
  const base = usePageThemeTokens()
  const { isDark } = base

  const statusStyles = useMemo<Record<TaskStatus, { color: string; bg: string; dot: string }>>(
    () => ({
      [TaskStatus.NEW]: {
        color: 'text-[#4880ff]',
        bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
        dot: 'bg-[#4880ff]',
      },
      [TaskStatus.IN_PROGRESS]: {
        color: 'text-orange-500',
        bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
        dot: 'bg-orange-500',
      },
      [TaskStatus.REVIEW]: {
        color: 'text-purple-500',
        bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
        dot: 'bg-purple-500',
      },
      [TaskStatus.DONE]: {
        color: 'text-emerald-500',
        bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
        dot: 'bg-emerald-500',
      },
      [TaskStatus.CANCELLED]: {
        color: 'text-red-500',
        bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
        dot: 'bg-red-500',
      },
    }),
    [isDark],
  )

  return {
    isDark: base.isDark,
    textPrimary: base.textPrimary,
    textSecondary: base.textSecondary,
    cardBg: base.cardBg,
    cardBorder: base.cardBorder,
    dividerColor: base.dividerColor,
    statusStyles,
    insightStyles: {
      error: {
        bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
        border: isDark ? 'border-red-500/30' : 'border-red-200',
        text: isDark ? 'text-red-400' : 'text-red-700',
        dot: 'bg-red-500',
      },
      warning: {
        bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
        border: isDark ? 'border-orange-500/30' : 'border-orange-200',
        text: isDark ? 'text-orange-400' : 'text-orange-700',
        dot: 'bg-orange-500',
      },
      info: {
        bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
        border: isDark ? 'border-[#4880ff]/30' : 'border-blue-200',
        text: isDark ? 'text-[#7aa5ff]' : 'text-blue-700',
        dot: 'bg-[#4880ff]',
      },
    } as const,
  }
}
