import type { TaskStatus } from '@/app/types'

export type EventFilterType = 'all' | 'tasks' | 'events'

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
