import { useMemo } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { useAuth } from '@/app/context/useAuth'
import { useTheme } from '@/app/context/useTheme'
import { useAnalyticsSectionAccess } from '@/app/hooks/useAnalyticsSectionAccess'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import {
  useReportsProjectsQuery,
  useReportsSummaryQuery,
  type ReportsSummaryResponse,
  type ReportsDifficultyDistributionItem,
  type ReportsStatusDistributionItem,
} from '@/app/features/reports'
import { reportsApi } from '@/app/api/reports'
import { tasksApi } from '@/app/api/tasks'
import { teamsApi } from '@/app/api/teams'
import { appQueryKeys } from '@/app/query'
import type { Task } from '@/app/types'
import { REPORTS_PAGE_CONSTANTS } from '@/app/pages/Reports/constants'
import { aggregateReportsSummaries, type GanttTask } from '@/app/pages/Reports/helpers'
import { useReportsFilterState } from '@/app/pages/Reports/hooks/useReportsFilterState'
import { useReportsThemeTokens } from '@/app/pages/Reports/hooks/useReportsThemeTokens'

export function useReportsPageModel() {
  const { isDark } = useTheme()
  const { isAdmin } = useAuth()
  const { allowed: canUseReports, isLoading: reportsAccessLoading } = useAnalyticsSectionAccess()
  const tokens = useReportsThemeTokens(isDark)
  const reportsApiEnabled = isAdmin || (!reportsAccessLoading && canUseReports)

  const projectsQuery = useReportsProjectsQuery({ enabled: reportsApiEnabled })
  const teamsQuery = useQuery({
    queryKey: appQueryKeys.teams.reportsOptions,
    queryFn: ({ signal }) => teamsApi.list({ page: 1, limit: 1000, sort: 'name' }, { signal }),
    staleTime: 60_000,
    enabled: reportsApiEnabled,
  })

  const projects = useMemo(
    () => [...(projectsQuery.data ?? [])].sort((left, right) => left.name.localeCompare(right.name, 'ru')),
    [projectsQuery.data],
  )
  const teamsMap = useMemo(() => {
    const map = new Map<number, string>()
    ;(teamsQuery.data?.items ?? []).forEach((team) => map.set(team.id, team.name))
    return map
  }, [teamsQuery.data?.items])

  const filters = useReportsFilterState(projects, teamsMap)
  const scopedProjectIds = filters.teamScopedProjects.map((project) => project.id)

  const singleProjectSummaryQuery = useReportsSummaryQuery(filters.effectiveProjectId, {
    enabled: reportsApiEnabled && filters.effectiveProjectId !== undefined,
  })
  const aggregatedSummaryQueries = useQueries({
    queries:
      reportsApiEnabled && filters.effectiveProjectId === undefined
        ? scopedProjectIds.map((projectId) => ({
            queryKey: appQueryKeys.reports.summary({ projectId }),
            queryFn: ({ signal }: { signal: AbortSignal }) => reportsApi.getSummary({ projectId }, { signal }),
            staleTime: 60_000,
          }))
        : [],
  })
  const aggregatedSummary = useMemo(
    () =>
      aggregateReportsSummaries(
        aggregatedSummaryQueries.map((query) => query.data).filter((row): row is ReportsSummaryResponse => row !== undefined),
      ),
    [aggregatedSummaryQueries],
  )
  const summary = filters.effectiveProjectId !== undefined ? singleProjectSummaryQuery.data : aggregatedSummary

  const tasksQuery = useQuery({
    queryKey: appQueryKeys.reports.ganttTasks({
      teamId: filters.selectedTeamId ?? null,
      projectId: filters.effectiveProjectId ?? null,
    }),
    queryFn: async ({ signal }) => {
      const response = await tasksApi.list(
        { page: 1, limit: 1000, ...(filters.effectiveProjectId !== undefined ? { projectId: filters.effectiveProjectId } : {}) },
        { signal },
      )
      const scopedIds = new Set(scopedProjectIds)
      return response.items.filter((task) => scopedIds.has(task.projectId))
    },
    enabled: reportsApiEnabled && scopedProjectIds.length > 0,
    staleTime: 60_000,
  })

  const ganttTasks = useMemo<GanttTask[]>(
    () =>
      (tasksQuery.data ?? [])
        .filter((task: Task) => !Number.isNaN(new Date(task.deadline).getTime()))
        .map((task) => ({ id: task.id, projectId: task.projectId, name: task.name, deadline: task.deadline }))
        .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
    [tasksQuery.data],
  )
  const todayStart = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  }, [])
  const maxDeadline = useMemo(() => {
    const max = ganttTasks.reduce((acc, task) => Math.max(acc, new Date(task.deadline).getTime()), todayStart + REPORTS_PAGE_CONSTANTS.DAY_MS)
    return Math.max(max, todayStart + REPORTS_PAGE_CONSTANTS.DAY_MS)
  }, [ganttTasks, todayStart])

  const normalizedDifficultyDistribution = useMemo(() => {
    const difficultyDistribution = summary?.difficultyDistribution ?? []
    if (difficultyDistribution.length === 0) return []
    const grouped = new Map<number, { label: string; value: number }>()
    difficultyDistribution.forEach((row: ReportsDifficultyDistributionItem) => {
      const prev = grouped.get(row.difficulty)
      grouped.set(row.difficulty, { label: row.label, value: (prev?.value ?? 0) + row.value })
    })
    const levels = [...grouped.keys()]
    const min = Math.min(...levels)
    const max = Math.max(...levels)
    const result: Array<{ difficulty: number; label: string; value: number }> = []
    for (let level = min; level <= max; level += 1) {
      const entry = grouped.get(level)
      result.push({ difficulty: level, label: entry?.label ?? `Сложность ${level}`, value: entry?.value ?? 0 })
    }
    return result
  }, [summary?.difficultyDistribution])

  const statusDistribution: ReportsStatusDistributionItem[] = summary?.statusDistribution ?? []
  const statusTotal = statusDistribution.reduce((sum: number, item: ReportsStatusDistributionItem) => sum + item.value, 0)
  const aggregatedErrors = aggregatedSummaryQueries.map((query) => query.error).find((error): error is Error => error instanceof Error)
  const summaryError = singleProjectSummaryQuery.error instanceof Error ? singleProjectSummaryQuery.error : aggregatedErrors
  const isAggregatePending = filters.effectiveProjectId === undefined && aggregatedSummaryQueries.some((query) => query.isPending)
  const isAggregateFetching = filters.effectiveProjectId === undefined && aggregatedSummaryQueries.some((query) => query.isFetching)
  const isInitialLoading =
    reportsApiEnabled && (filters.effectiveProjectId !== undefined ? singleProjectSummaryQuery.isPending : isAggregatePending) && !summary
  const isRefreshing =
    reportsApiEnabled && (filters.effectiveProjectId !== undefined ? singleProjectSummaryQuery.isFetching : isAggregateFetching) && !!summary
  const errorMessage =
    summaryError instanceof Error ? summaryError.message : 'Не удалось загрузить данные аналитики. Попробуйте обновить страницу.'
  const showInitialSkeleton = useSmoothPageSkeleton((!isAdmin && reportsAccessLoading) || isInitialLoading)

  const refreshAll = () => {
    if (filters.effectiveProjectId !== undefined) void singleProjectSummaryQuery.refetch()
    else aggregatedSummaryQueries.forEach((query) => { void query.refetch() })
    void tasksQuery.refetch()
  }

  return {
    isDark,
    isAdmin,
    reportsAccessLoading,
    canUseReports,
    tokens,
    reportsApiEnabled,
    projectsQuery,
    teamsQuery,
    filters,
    summary,
    summaryError,
    ganttTasks,
    todayStart,
    maxDeadline,
    normalizedDifficultyDistribution,
    statusDistribution,
    statusTotal,
    isRefreshing,
    errorMessage,
    showInitialSkeleton,
    refreshAll,
  }
}

export type ReportsPageModel = ReturnType<typeof useReportsPageModel>
