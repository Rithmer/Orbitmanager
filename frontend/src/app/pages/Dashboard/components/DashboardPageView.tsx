import { PageShell } from '@/app/components/PageShell'
import { DASHBOARD_PAGE_CONSTANTS } from '@/app/pages/Dashboard/constants'
import type { DashboardPageViewModel } from '@/app/pages/Dashboard/hooks/useDashboardPageController'
import { DashboardSkeletonState, DashboardErrorState } from '@/app/pages/Dashboard/components/DashboardStates'
import {
  DashboardHeaderActions,
  DashboardStatsSection,
  DashboardRecentActivitySection,
  DashboardRiskInsightsSection,
} from '@/app/pages/Dashboard/components/DashboardSections'

type DashboardPageViewProps = {
  model: DashboardPageViewModel
}

export function DashboardPageView({ model }: DashboardPageViewProps) {
  if (model.phase === 'skeleton') {
    return (
      <DashboardSkeletonState firstName={model.firstName} cardBg={model.cardBg} cardBorder={model.cardBorder} />
    )
  }

  if (model.phase === 'error') {
    return (
      <DashboardErrorState
        firstName={model.firstName}
        errorMessage={model.errorMessage}
        textSecondary={model.textSecondary}
        onRetry={model.onRetry}
      />
    )
  }

  const m = model

  return (
    <PageShell
      title={`Добро пожаловать, ${m.firstName}!`}
      description={
        m.isRefreshing ? 'Сводка обновляется в фоне.' : `У вас ${m.overviewInProgress} активных задач.`
      }
      actions={
        <DashboardHeaderActions
          isRefreshing={m.isRefreshing}
          projectsAccessLoading={m.projectsAccessLoading}
          canUseProjectsSection={m.canUseProjectsSection}
          onCreateProject={m.onCreateProject}
        />
      }
    >
      {m.summaryQueryError && m.hasSummary ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {DASHBOARD_PAGE_CONSTANTS.refreshFailedMessage}
        </div>
      ) : null}
      <DashboardStatsSection stats={m.stats} isRefreshing={m.isRefreshing} ui={m.ui} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <DashboardRecentActivitySection
          isAdmin={m.isAdmin}
          recentTasks={m.recentTasks}
          recentAudit={m.recentAudit}
          isRefreshing={m.isRefreshing}
          isAuditRefreshing={m.auditQuery.isFetching}
          ui={m.ui}
          onOpenProjectBoard={m.onOpenProjectBoard}
        />
        <DashboardRiskInsightsSection riskInsights={m.riskInsights} isRefreshing={m.isRefreshing} ui={m.ui} />
      </div>
    </PageShell>
  )
}
