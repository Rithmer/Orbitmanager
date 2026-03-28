import { getPageSurfaceTokens } from '@/app/hooks/pageSurfaceTokens'
import { ProjectStatus } from '@/app/types'

export function useProjectsPageThemeTokens(isDark: boolean) {
  const { textPrimary, textSecondary, dividerColor } = getPageSurfaceTokens(isDark)
  const inputBg = isDark
    ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]'
    : 'bg-white border-[#e8e8e8] text-[#202224]'
  const moreIconColor = isDark
    ? 'text-[#94a3b8] hover:text-[#f4f3f2]'
    : 'text-gray-400 hover:text-gray-600'

  const statusClassMap: Record<ProjectStatus, { bg: string; text: string }> = {
    [ProjectStatus.ACTIVE]: {
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      text: 'text-emerald-500',
    },
    [ProjectStatus.ON_HOLD]: {
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      text: 'text-amber-500',
    },
    [ProjectStatus.COMPLETED]: {
      bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      text: 'text-[#4880ff]',
    },
    [ProjectStatus.ARCHIVED]: {
      bg: isDark ? 'bg-[#94a3b8]/10' : 'bg-gray-50',
      text: 'text-[#94a3b8]',
    },
  }

  return {
    textPrimary,
    textSecondary,
    dividerColor,
    inputBg,
    moreIconColor,
    statusClassMap,
  }
}
