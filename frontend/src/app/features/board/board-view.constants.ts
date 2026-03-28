import { RiskLevel } from '@/app/types'
import { TaskStatus } from '@/app/types'
import type { ProjectBoardTask } from '@/app/features/board/types'

export const PROJECT_BOARD_COLUMNS = [
  { status: TaskStatus.NEW, title: 'Запланировано', accent: '#4880ff' },
  { status: TaskStatus.IN_PROGRESS, title: 'В процессе', accent: '#f59e0b' },
  { status: TaskStatus.REVIEW, title: 'Тестирование', accent: '#8b5cf6' },
  { status: TaskStatus.DONE, title: 'Выполнено', accent: '#10b981' },
  { status: TaskStatus.CANCELLED, title: 'Отменено', accent: '#ef4444' },
] as const

export function getRiskBadgeClasses(riskLevel?: RiskLevel) {
  if (riskLevel === RiskLevel.HIGH) {
    return {
      text: 'text-red-500',
      background: 'bg-red-50 dark:bg-red-500/10',
    }
  }

  if (riskLevel === RiskLevel.MEDIUM) {
    return {
      text: 'text-amber-500',
      background: 'bg-amber-50 dark:bg-amber-500/10',
    }
  }

  return {
    text: 'text-emerald-500',
    background: 'bg-emerald-50 dark:bg-emerald-500/10',
  }
}

export function getOverdueLabel(task: ProjectBoardTask): boolean {
  return (
    new Date(task.deadline).getTime() < Date.now() &&
    task.status !== TaskStatus.DONE &&
    task.status !== TaskStatus.CANCELLED
  )
}

export function getColumnTasks(tasks: ProjectBoardTask[], status: TaskStatus) {
  return tasks.filter((task) => task.status === status)
}

export const KANBAN_COLUMN_PREVIEW_TASKS = 3

export const BOARD_PROJECT_CARD_COLORS = [
  'bg-[#4880ff]',
  'bg-[#10b981]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#ef4444]',
] as const
