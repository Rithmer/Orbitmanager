import { PageShell } from '@/app/components/PageShell'
import { ReportsChartsGrid, ReportsDifficultyLineSection } from '@/app/pages/Reports/components/ReportsCharts'
import {
  ReportsAccessDenied,
  ReportsErrorState,
  ReportsInitialLoadingShell,
  ReportsSummaryWarning,
  ReportsToolbar,
} from '@/app/pages/Reports/components/ReportsPageShell'
import type { useReportsPageController } from '@/app/pages/Reports/hooks/useReportsPageController'

type ReportsPageControllerModel = ReturnType<typeof useReportsPageController>

type ReportsPageViewProps = {
  controller: ReportsPageControllerModel
}

export function ReportsPageView({ controller }: ReportsPageViewProps) {
  const { model, onNavigateToBoard } = controller
  const {
    isAdmin,
    reportsAccessLoading,
    canUseReports,
    tokens,
    projectsQuery,
    teamsQuery,
    filters,
    summary,
    summaryError,
    normalizedDifficultyDistribution,
    isRefreshing,
    errorMessage,
    showInitialSkeleton,
    refreshAll,
  } = model

  if (showInitialSkeleton) {
    return <ReportsInitialLoadingShell />
  }

  if (!isAdmin && !reportsAccessLoading && !canUseReports) {
    return <ReportsAccessDenied textSecondary={tokens.textSecondary} />
  }

  if (!summary && summaryError) {
    return <ReportsErrorState errorMessage={errorMessage} textSecondary={tokens.textSecondary} onRetry={refreshAll} />
  }

  return (
    <PageShell
      title="Аналитика"
      description={
        isRefreshing
          ? 'Сводка обновляется в фоне.'
          : 'Фильтрация по командам/проектам, диаграмма дедлайнов и распределение по сложности.'
      }
      actions={
        <ReportsToolbar
          isDark={model.isDark}
          textSecondary={tokens.textSecondary}
          selectedTeamId={filters.selectedTeamId}
          selectedProjectId={filters.effectiveProjectId}
          teamOptions={filters.teamOptions}
          projectOptions={filters.teamScopedProjects}
          filtersPending={projectsQuery.isPending || teamsQuery.isPending}
          isRefreshing={isRefreshing}
          onChangeTeam={(teamId) => {
            filters.setSelectedTeamId(teamId)
            filters.setSelectedProjectId(undefined)
          }}
          onChangeProject={filters.setSelectedProjectId}
          onRefresh={refreshAll}
        />
      }
    >
      <ReportsSummaryWarning show={!!summaryError && !!summary} />
      <ReportsChartsGrid model={model} onNavigateToBoard={onNavigateToBoard} />
      <ReportsDifficultyLineSection tokens={tokens} normalizedDifficultyDistribution={normalizedDifficultyDistribution} />
    </PageShell>
  )
}
