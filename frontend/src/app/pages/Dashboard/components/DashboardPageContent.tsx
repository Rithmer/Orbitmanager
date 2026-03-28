import { useNavigate } from 'react-router'
import { PageShell } from '@/app/components/PageShell'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { DASHBOARD_PAGE_CONSTANTS } from '@/app/pages/Dashboard/constants'
import { useDashboardData } from '@/app/pages/Dashboard/hooks/useDashboardData'
import { useDashboardThemeTokens } from '@/app/pages/Dashboard/hooks/useDashboardThemeTokens'
import { DashboardSkeletonState, DashboardErrorState } from '@/app/pages/Dashboard/components/DashboardStates'
import { DashboardHeaderActions } from '@/app/pages/Dashboard/components/DashboardHeaderActions'
import {
  DashboardStatsSection,
  DashboardRecentActivitySection,
  DashboardRiskInsightsSection,
} from '@/app/pages/Dashboard/components/DashboardSections'

export function DashboardPageContent() {
  const navigate = useNavigate()
  const {
    isAdmin,
    firstName,
    canUseProjectsSection,
    projectsAccessLoading,
    summaryQuery,
    auditQuery,
    summary,
    overview,
    recentTasks,
    riskInsights,
    recentAudit,
    isInitialLoading,
    isRefreshing,
    errorMessage,
    stats,
  } = useDashboardData()
  const { isDark, textPrimary, textSecondary, cardBg, cardBorder, dividerColor, statusStyles, insightStyles } =
    useDashboardThemeTokens()

  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoading)

  if (showInitialSkeleton) {
    return <DashboardSkeletonState firstName={firstName} cardBg={cardBg} cardBorder={cardBorder} />
  }

  if (!summary && summaryQuery.error) {
    return (
      <DashboardErrorState
        firstName={firstName}
        errorMessage={errorMessage}
        textSecondary={textSecondary}
        onRetry={() => void summaryQuery.refetch()}
      />
    )
  }

  return (
    <PageShell
      title={`Добро пожаловать, ${firstName}!`}
      description={
        isRefreshing ? 'Сводка обновляется в фоне.' : `У вас ${overview?.inProgressTasks ?? 0} активных задач.`
      }
      actions={
        <DashboardHeaderActions
          isRefreshing={isRefreshing}
          projectsAccessLoading={projectsAccessLoading}
          canUseProjectsSection={canUseProjectsSection}
          onCreateProject={() => navigate('/projects')}
        />
      }
    >
      {summaryQuery.error && summary ? (
        <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
          {DASHBOARD_PAGE_CONSTANTS.refreshFailedMessage}
        </div>
      ) : null}
      <DashboardStatsSection
        stats={stats}
        isRefreshing={isRefreshing}
        cardBg={cardBg}
        cardBorder={cardBorder}
        textPrimary={textPrimary}
        textSecondary={textSecondary}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <DashboardRecentActivitySection
          isAdmin={isAdmin}
          recentTasks={recentTasks}
          recentAudit={recentAudit}
          isRefreshing={isRefreshing}
          isAuditRefreshing={auditQuery.isFetching}
          cardBg={cardBg}
          cardBorder={cardBorder}
          dividerColor={dividerColor}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          isDark={isDark}
          statusStyles={statusStyles}
          onOpenProjectBoard={(projectId) => navigate(`/board/${projectId}`)}
        />
        <DashboardRiskInsightsSection
          riskInsights={riskInsights}
          isRefreshing={isRefreshing}
          cardBg={cardBg}
          cardBorder={cardBorder}
          textSecondary={textSecondary}
          insightStyles={insightStyles}
        />
      </div>
    </PageShell>
  )
}
