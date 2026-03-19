import { api, buildQuery, type ApiRequestOptions } from './client'
import type { CalendarEvent, PaginatedResult, QueryParams } from '../types'

export const calendarApi = {
  list(
    params: QueryParams & { from?: string; to?: string; projectId?: number } = {},
    options: ApiRequestOptions = {},
  ): Promise<PaginatedResult<CalendarEvent>> {
    return api.get(`/calendar-events${buildQuery(params)}`, options)
  },

  getById(id: number, options: ApiRequestOptions = {}): Promise<CalendarEvent> {
    return api.get(`/calendar-events/${id}`, options)
  },

  create(dto: {
    title: string
    description?: string
    startDate: string
    endDate: string
    allDay?: boolean
    color?: string
    projectId?: number
    taskId?: number
  }): Promise<CalendarEvent> {
    return api.post('/calendar-events', dto)
  },

  update(
    id: number,
    dto: Partial<{
      title: string
      description: string
      startDate: string
      endDate: string
      allDay: boolean
      color: string
      projectId: number | null
      taskId: number | null
    }>,
  ): Promise<CalendarEvent> {
    return api.patch(`/calendar-events/${id}`, dto)
  },

  delete(id: number): Promise<void> {
    return api.delete(`/calendar-events/${id}`)
  },
}
