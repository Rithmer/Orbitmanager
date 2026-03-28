import type { DashboardRecentTaskItem } from '@/app/features/dashboard/types'

export function formatRecentTaskAssigneesShort(task: DashboardRecentTaskItem): string {
  const namesFromList = task.assigneeNames ?? []
  const firstName = task.assigneeName ?? namesFromList[0] ?? null
  const totalCount =
    typeof task.assigneeCount === 'number' ? task.assigneeCount : namesFromList.length ?? 0

  if (totalCount <= 0 || !firstName) return 'Без исполнителя'
  if (totalCount === 1) return firstName
  return `${firstName} +${totalCount - 1}`
}
