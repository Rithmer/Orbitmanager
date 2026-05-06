import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { usePageThemeTokens } from '@/app/hooks/usePageThemeTokens'
import { RISKS_PAGE_CONSTANTS } from '@/app/pages/Risks/constants'
import { useRisksSelectionState } from '@/app/pages/Risks/hooks/useRisksSelectionState'
import { useRisksPageData } from '@/app/pages/Risks/hooks/useRisksPageData'

export function useRisksPageController() {
  const base = usePageThemeTokens()
  const theme = {
    isDark: base.isDark,
    textSecondary: base.textSecondary,
    cardBg: base.cardBg,
    cardBorder: base.cardBorder,
    panelMuted: base.isDark ? 'bg-[#1f2a3b]' : 'bg-[#f8fafc]',
    divider: base.isDark ? 'bg-[#313d4f]' : 'bg-[#e5e7eb]',
  }
  const selection = useRisksSelectionState()
  const data = useRisksPageData({
    selectedTeamId: selection.selectedTeamId,
    selectedProjectId: selection.selectedProjectId,
    selectedTaskId: selection.selectedTaskId,
  })
  const showInitialSkeleton = useSmoothPageSkeleton(data.waitingForAccess || data.isInitialLoading)

  return {
    theme,
    selection,
    data,
    showInitialSkeleton,
    pageTitle: RISKS_PAGE_CONSTANTS.pageTitle,
    pageDescription: RISKS_PAGE_CONSTANTS.pageDescription,
  }
}
