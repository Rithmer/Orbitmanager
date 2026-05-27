import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { projectsApi } from '@/app/api/projects'
import { tasksApi } from '@/app/api/tasks'
import { useTheme } from '@/app/context/useTheme'
import { appQueryKeys } from '@/app/query'
import { ProjectStatus, TaskStatus, type Project, type Task } from '@/app/types'
import type { AboutPeriodStats, AboutStatsPeriod, AboutPageViewModel } from '@/app/pages/About/types'

const ABOUT_METRICS_LIMIT = 1000

function getPeriodStart(period: AboutStatsPeriod) {
  const now = new Date()

  if (period === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  if (period === 'quarter') {
    const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3
    return new Date(now.getFullYear(), quarterStartMonth, 1)
  }
  return new Date(now.getFullYear(), 0, 1)
}

function isWithinPeriod(dateString: string | null | undefined, periodStart: Date, now: Date) {
  if (!dateString) return false
  const value = new Date(dateString).getTime()
  if (Number.isNaN(value)) return false
  return value >= periodStart.getTime() && value <= now.getTime()
}

function getTaskCompletedAt(task: Task): string {
  const maybeCompletedAt = (task as Task & { completedAt?: string | null }).completedAt
  return maybeCompletedAt ?? task.updatedAt
}

function computeStats(period: AboutStatsPeriod, projects: Project[], tasks: Task[]): AboutPeriodStats {
  const now = new Date()
  const periodStart = getPeriodStart(period)

  const projectsInPeriod = projects.filter((project) => isWithinPeriod(project.createdAt, periodStart, now))
  const projectsInWork = projectsInPeriod.filter(
    (project) => project.status === ProjectStatus.ACTIVE || project.status === ProjectStatus.ON_HOLD,
  )

  const completedTasksInPeriod = tasks.filter(
    (task) =>
      task.status === TaskStatus.DONE &&
      isWithinPeriod(getTaskCompletedAt(task), periodStart, now),
  )
  const completedOnTime = completedTasksInPeriod.filter(
    (task) => new Date(getTaskCompletedAt(task)).getTime() <= new Date(task.deadline).getTime(),
  ).length
  const activeTeamsCount = new Set(
    projects
      .filter((project) => project.status === ProjectStatus.ACTIVE)
      .map((project) => project.teamId),
  ).size

  return {
    projects: projectsInWork.length,
    tasks: completedTasksInPeriod.length,
    teams: activeTeamsCount,
    onTimeRate:
      completedTasksInPeriod.length === 0
        ? 0
        : Math.round((completedOnTime / completedTasksInPeriod.length) * 100),
  }
}

export function useAboutPageController(): AboutPageViewModel {
  const { isDark } = useTheme()
  const [activePeriod, setActivePeriod] = useState<AboutStatsPeriod>('month')

  const projectsQuery = useQuery({
    queryKey: appQueryKeys.projects.root,
    queryFn: ({ signal }) => projectsApi.list({ page: 1, limit: ABOUT_METRICS_LIMIT }, { signal }),
    staleTime: 60_000,
  })
  const tasksQuery = useQuery({
    queryKey: ['about', 'metrics', 'tasks'] as const,
    queryFn: ({ signal }) => tasksApi.list({ page: 1, limit: ABOUT_METRICS_LIMIT }, { signal }),
    staleTime: 60_000,
  })

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const stats = useMemo(
    () => computeStats(activePeriod, projectsQuery.data?.items ?? [], tasksQuery.data?.items ?? []),
    [activePeriod, projectsQuery.data?.items, tasksQuery.data?.items],
  )

  return {
    isDark,
    activePeriod,
    setActivePeriod,
    pageBg,
    cardBg,
    cardBorder,
    textPrimary,
    textSecondary,
    stats,
  }
}
