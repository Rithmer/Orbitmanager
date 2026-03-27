import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { usePageThemeTokens } from '@/app/hooks/usePageThemeTokens'
import { ApiErrorBanner } from '@/app/components/ApiErrorBanner'
import { PageRefreshOverlay, PageShell } from '@/app/components/PageShell'
import { RISKS_PAGE_CONSTANTS } from '@/app/pages/Risks/constants'
import { useRisksSelectionState } from '@/app/pages/Risks/hooks/useRisksSelectionState'
import { useRisksPageData } from '@/app/pages/Risks/hooks/useRisksPageData'
import { RisksSkeletonState } from '@/app/pages/Risks/components/RisksSkeletonState'
import { RisksAccessDeniedState } from '@/app/pages/Risks/components/RisksAccessDeniedState'
import { RisksToolbarActions } from '@/app/pages/Risks/components/RisksToolbarActions'
import { RisksErrorState } from '@/app/pages/Risks/components/RisksErrorState'
import { RisksNavigatorSection } from '@/app/pages/Risks/components/RisksNavigatorSection'
import { RisksInsightsSection } from '@/app/pages/Risks/components/RisksInsightsSection'

export function RisksPageContent() {
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

  if (showInitialSkeleton) {
    return <RisksSkeletonState />
  }

  if (!data.isAdmin && !data.risksAccessLoading && !data.canUseRisks) {
    return <RisksAccessDeniedState textSecondary={theme.textSecondary} />
  }

  return (
    <PageShell
      title={RISKS_PAGE_CONSTANTS.pageTitle}
      description={RISKS_PAGE_CONSTANTS.pageDescription}
      actions={<RisksToolbarActions isRefreshing={data.isRefreshing} onRefresh={() => void data.risksSummaryQuery.refetch()} />}
    >
      <ApiErrorBanner />

      {data.risksSummaryQuery.error && data.cards.length === 0 ? (
        <RisksErrorState
          isMlDown={data.isMlDown}
          textSecondary={theme.textSecondary}
          errorMessage={data.errorMessage}
          onRetry={() => void data.risksSummaryQuery.refetch()}
        />
      ) : (
        <PageRefreshOverlay show={data.isRefreshing} label="Обновляем данные рисков">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <RisksNavigatorSection
              selectedTeamId={selection.selectedTeamId}
              sortedTeams={data.sortedTeams}
              sortedProjects={data.sortedProjects}
              effectiveProjectId={data.effectiveProjectId}
              cardBg={theme.cardBg}
              cardBorder={theme.cardBorder}
              textSecondary={theme.textSecondary}
              divider={theme.divider}
              isDark={theme.isDark}
              onSelectTeam={selection.selectTeam}
              onBackToTeams={selection.goBackToTeams}
              onSelectProject={selection.selectProject}
            />
            <RisksInsightsSection
              selectedTeamId={selection.selectedTeamId}
              selectedCard={data.selectedCard}
              sortedTaskInsights={data.sortedTaskInsights}
              selectedTask={data.selectedTask}
              topRecommendedAssignees={data.topRecommendedAssignees}
              cardBg={theme.cardBg}
              cardBorder={theme.cardBorder}
              panelMuted={theme.panelMuted}
              textSecondary={theme.textSecondary}
              divider={theme.divider}
              expandedAlternativesByTaskId={selection.expandedAlternativesByTaskId}
              onSelectTask={selection.setSelectedTaskId}
              onToggleAlternatives={(taskId) =>
                selection.setExpandedAlternativesByTaskId((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
              }
            />
          </div>
        </PageRefreshOverlay>
      )}
    </PageShell>
  )
}
