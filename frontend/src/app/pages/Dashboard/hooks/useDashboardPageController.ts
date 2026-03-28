import { useNavigate } from 'react-router'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { useDashboardData } from '@/app/pages/Dashboard/hooks/useDashboardData'
import { useDashboardThemeTokens } from '@/app/pages/Dashboard/hooks/useDashboardThemeTokens'
import type { DashboardPageUiTokens } from '@/app/pages/Dashboard/types'

export type DashboardPageViewModel =
  | {
      phase: 'skeleton'
      firstName: string
      cardBg: string
      cardBorder: string
    }
  | {
      phase: 'error'
      firstName: string
      errorMessage: string
      textSecondary: string
      onRetry: () => void
    }
  | {
      phase: 'ready'
      firstName: string
      isRefreshing: boolean
      overviewInProgress: number
      summaryQueryError: boolean
      hasSummary: boolean
      onCreateProject: () => void
      isAdmin: boolean
      canUseProjectsSection: boolean
      projectsAccessLoading: boolean
      summaryQuery: ReturnType<typeof useDashboardData>['summaryQuery']
      auditQuery: ReturnType<typeof useDashboardData>['auditQuery']
      recentTasks: ReturnType<typeof useDashboardData>['recentTasks']
      recentAudit: ReturnType<typeof useDashboardData>['recentAudit']
      riskInsights: ReturnType<typeof useDashboardData>['riskInsights']
      stats: ReturnType<typeof useDashboardData>['stats']
      ui: DashboardPageUiTokens
      onOpenProjectBoard: (projectId: number) => void
    }

export function useDashboardPageController(): DashboardPageViewModel {
  const navigate = useNavigate()
  const data = useDashboardData()
  const theme = useDashboardThemeTokens()
  const showInitialSkeleton = useSmoothPageSkeleton(data.isInitialLoading)

  if (showInitialSkeleton) {
    return {
      phase: 'skeleton',
      firstName: data.firstName,
      cardBg: theme.cardBg,
      cardBorder: theme.cardBorder,
    }
  }

  if (!data.summary && data.summaryQuery.error) {
    return {
      phase: 'error',
      firstName: data.firstName,
      errorMessage: data.errorMessage,
      textSecondary: theme.textSecondary,
      onRetry: () => void data.summaryQuery.refetch(),
    }
  }

  return {
    phase: 'ready',
    firstName: data.firstName,
    isRefreshing: data.isRefreshing,
    overviewInProgress: data.overview?.inProgressTasks ?? 0,
    summaryQueryError: Boolean(data.summaryQuery.error),
    hasSummary: Boolean(data.summary),
    onCreateProject: () => navigate('/projects'),
    isAdmin: data.isAdmin,
    canUseProjectsSection: data.canUseProjectsSection,
    projectsAccessLoading: data.projectsAccessLoading,
    summaryQuery: data.summaryQuery,
    auditQuery: data.auditQuery,
    recentTasks: data.recentTasks,
    recentAudit: data.recentAudit,
    riskInsights: data.riskInsights,
    stats: data.stats,
    ui: {
      isDark: theme.isDark,
      textPrimary: theme.textPrimary,
      textSecondary: theme.textSecondary,
      cardBg: theme.cardBg,
      cardBorder: theme.cardBorder,
      dividerColor: theme.dividerColor,
      statusStyles: theme.statusStyles,
      insightStyles: theme.insightStyles,
    },
    onOpenProjectBoard: (projectId: number) => navigate(`/board/${projectId}`),
  }
}
