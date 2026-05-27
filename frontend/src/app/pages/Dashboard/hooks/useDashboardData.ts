import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertCircle, CheckCircle2, Clock, TestTube2 } from 'lucide-react'
import { useAuth } from '@/app/context/useAuth'
import { useProjectsSectionAccess } from '@/app/hooks/useProjectsSectionAccess'
import { useDashboardSummaryQuery } from '@/app/features/dashboard'
import { auditApi } from '@/app/api/audit'
import { AccountRole } from '@/app/types'
import { appQueryKeys } from '@/app/query'
import { DASHBOARD_PAGE_CONSTANTS } from '@/app/pages/Dashboard/constants'

export function useDashboardData() {
  const { user } = useAuth()
  const isAdmin = user?.accountRole === AccountRole.ADMIN
  const summaryQuery = useDashboardSummaryQuery()
  const { allowed: canUseProjectsSection, isLoading: projectsAccessLoading } = useProjectsSectionAccess()

  const auditQuery = useQuery({
    queryKey: appQueryKeys.dashboard.adminAuditRecent,
    queryFn: ({ signal }) => auditApi.list({ page: 1, limit: 6, sort: '-timestamp' }, { signal }),
    enabled: isAdmin,
    staleTime: 30_000,
  })

  const summary = summaryQuery.data
  const overview = summary?.overview
  const recentTasks = summary?.recentTasks ?? []
  const riskInsights = summary?.riskInsights ?? []
  const recentAudit = auditQuery.data?.items ?? []
  const firstName = user?.fullName?.split(' ')[0] || DASHBOARD_PAGE_CONSTANTS.welcomeFallbackName
  const isInitialLoading = summaryQuery.isPending && !summary
  const isRefreshing = summaryQuery.isFetching && !!summary
  const errorMessage =
    summaryQuery.error instanceof Error
      ? summaryQuery.error.message
      : DASHBOARD_PAGE_CONSTANTS.loadErrorFallbackMessage

  const stats = useMemo(
    () => [
      {
        label: 'Выполнено',
        value: String(overview?.doneTasks ?? 0),
        change: `из ${overview?.totalTasks ?? 0} задач`,
        icon: CheckCircle2,
        iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
        iconColor: 'text-emerald-500',
      },
      {
        label: 'В процессе',
        value: String(overview?.inProgressTasks ?? 0),
        change: 'активных задач',
        icon: Clock,
        iconBg: 'bg-orange-50 dark:bg-orange-500/10',
        iconColor: 'text-orange-500',
      },
      {
        label: 'Тестирование',
        value: String(overview?.reviewTasks ?? 0),
        change: 'на проверке',
        icon: TestTube2,
        iconBg: 'bg-purple-50 dark:bg-purple-500/10',
        iconColor: 'text-purple-500',
      },
      {
        label: 'Просрочено',
        value: String(overview?.overdueTasks ?? 0),
        change: (overview?.overdueTasks ?? 0) > 0 ? 'требует внимания' : 'все в порядке',
        icon: AlertCircle,
        iconBg: 'bg-red-50 dark:bg-red-500/10',
        iconColor: 'text-red-500',
      },
    ],
    [overview?.doneTasks, overview?.inProgressTasks, overview?.overdueTasks, overview?.reviewTasks, overview?.totalTasks],
  )

  return {
    user,
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
  }
}
