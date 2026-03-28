import type { ReportsStatusDistributionItem, ReportsSummaryResponse } from '@/app/features/reports'

export function sameStatusRow(
  a: ReportsStatusDistributionItem | null | undefined,
  b: ReportsStatusDistributionItem | null | undefined,
): boolean {
  if (!a || !b) return false
  if (a === b) return true
  return a.label === b.label && a.value === b.value
}

export function aggregateReportsSummaries(
  summaries: ReportsSummaryResponse[],
): ReportsSummaryResponse | undefined {
  if (summaries.length === 0) return undefined
  const overview = summaries.reduce<ReportsSummaryResponse['overview']>(
    (acc, item) => ({
      doneTasks: acc.doneTasks + item.overview.doneTasks,
      inProgressTasks: acc.inProgressTasks + item.overview.inProgressTasks,
      reviewTasks: acc.reviewTasks + item.overview.reviewTasks,
      newTasks: acc.newTasks + item.overview.newTasks,
      overdueTasks: acc.overdueTasks + item.overview.overdueTasks,
      totalTasks: acc.totalTasks + item.overview.totalTasks,
      efficiency: 0,
      projectCount: acc.projectCount + item.overview.projectCount,
    }),
    { doneTasks: 0, inProgressTasks: 0, reviewTasks: 0, newTasks: 0, overdueTasks: 0, totalTasks: 0, efficiency: 0, projectCount: 0 },
  )
  overview.efficiency = overview.totalTasks > 0 ? Math.round((overview.doneTasks / overview.totalTasks) * 100) : 0

  const statusMap = new Map<string, { label: string; value: number; color: string }>()
  const difficultyMap = new Map<number, { difficulty: number; label: string; value: number }>()
  const projectsMap = new Map<number, { projectId: number; projectName: string; taskCount: number; completedTaskCount: number }>()
  summaries.forEach((summary) => {
    summary.statusDistribution.forEach((row) => {
      const prev = statusMap.get(row.label)
      statusMap.set(row.label, { label: row.label, color: row.color, value: (prev?.value ?? 0) + row.value })
    })
    summary.difficultyDistribution.forEach((row) => {
      const prev = difficultyMap.get(row.difficulty)
      difficultyMap.set(row.difficulty, { difficulty: row.difficulty, label: row.label, value: (prev?.value ?? 0) + row.value })
    })
    summary.projectTaskBreakdown.forEach((row) => {
      const prev = projectsMap.get(row.projectId)
      projectsMap.set(row.projectId, { projectId: row.projectId, projectName: row.projectName, taskCount: (prev?.taskCount ?? 0) + row.taskCount, completedTaskCount: (prev?.completedTaskCount ?? 0) + row.completedTaskCount })
    })
  })

  return {
    overview,
    statusDistribution: [...statusMap.values()].sort((a, b) => b.value - a.value),
    difficultyDistribution: [...difficultyMap.values()].sort((a, b) => a.difficulty - b.difficulty),
    projectTaskBreakdown: [...projectsMap.values()].sort((a, b) => b.taskCount - a.taskCount),
  }
}

export function formatDeadline(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('ru-RU')
}

export const RADIAN = Math.PI / 180

export function percentOfTotal(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0
}
