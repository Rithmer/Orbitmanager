import type { TaskStatus } from '@/app/types'

/** Фильтр отображаемых элементов в сетке календаря */
export type EventFilterType = 'all' | 'tasks' | 'events'

/** Задача или событие в ячейке дня календаря */
export interface CalItem {
  id: string
  type: 'task' | 'event'
  title: string
  color: string
  textColor: string
  time: string
  duration?: string
  description?: string
  status?: TaskStatus | string
  eventId?: number
  taskId?: number
  projectName?: string
}
