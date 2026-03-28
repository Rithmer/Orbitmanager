import type { ProjectBoardMember, ProjectBoardTask } from '@/app/features/board/types'

export function getTaskAssigneeIds(task: ProjectBoardTask): number[] {
  const ids =
    task.assigneeIds && task.assigneeIds.length > 0
      ? task.assigneeIds
      : typeof task.assigneeId === 'number'
        ? [task.assigneeId]
        : task.assignee
          ? [task.assignee.id]
          : []

  return ids.filter((id) => typeof id === 'number' && id > 0)
}

export function buildBoardAssigneeFormatters(members: ProjectBoardMember[]) {
  const assigneeFullNameById = new Map(members.map((m) => [m.userId, m.user.fullName] as const))

  function formatTaskAssigneesShort(task: ProjectBoardTask): string {
    const ids = getTaskAssigneeIds(task)
    if (ids.length === 0) return 'Не назначен'

    const firstName = assigneeFullNameById.get(ids[0])
    if (!firstName) return 'Не назначен'

    if (ids.length === 1) return firstName
    return `${firstName} +${ids.length - 1}`
  }

  function formatTaskAssigneesDetail(task: ProjectBoardTask): string {
    if (task.assignees && task.assignees.length > 0) {
      const names = task.assignees.map((a) => a.fullName).filter(Boolean)
      if (names.length === 0) return 'Не назначен'
      if (names.length === 1) return names[0]
      return names.join('\n')
    }

    const ids = getTaskAssigneeIds(task)
    if (ids.length === 0) return 'Не назначен'

    const names = ids
      .map((id) => assigneeFullNameById.get(id))
      .filter((n): n is string => Boolean(n))

    if (names.length === 0) return 'Не назначен'
    if (names.length === 1) return names[0]
    return names.join('\n')
  }

  return { formatTaskAssigneesShort, formatTaskAssigneesDetail }
}
