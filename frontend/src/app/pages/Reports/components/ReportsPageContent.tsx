import { useNavigate } from 'react-router'
import { PageShell } from '@/app/components/PageShell'
import { ReportsAccessDenied } from '@/app/pages/Reports/components/ReportsAccessDenied'
import { ReportsChartsGrid } from '@/app/pages/Reports/components/ReportsChartsGrid'
import { ReportsDifficultyLineSection } from '@/app/pages/Reports/components/ReportsDifficultyLineSection'
import { ReportsErrorState } from '@/app/pages/Reports/components/ReportsErrorState'
import { ReportsInitialLoadingShell } from '@/app/pages/Reports/components/ReportsInitialLoadingShell'
import { ReportsSummaryWarning } from '@/app/pages/Reports/components/ReportsSummaryWarning'
import { ReportsToolbar } from '@/app/pages/Reports/components/ReportsToolbar'
import { useReportsPageModel } from '@/app/pages/Reports/hooks/useReportsPageModel'

export function ReportsPageContent() {
  const navigate = useNavigate()
  const model = useReportsPageModel()

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
      <ReportsChartsGrid model={model} onNavigateToBoard={(projectId) => navigate(`/board/${projectId}`)} />
      <ReportsDifficultyLineSection tokens={tokens} normalizedDifficultyDistribution={normalizedDifficultyDistribution} />
    </PageShell>
  )
}
