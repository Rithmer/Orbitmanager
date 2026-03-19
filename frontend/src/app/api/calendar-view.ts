import { api, buildQuery, type ApiRequestOptions } from './client'
import type { CalendarMonthView, CalendarMonthViewQueryParams } from '../features/calendar'

export const calendarViewApi = {
  getMonthView(
    params: CalendarMonthViewQueryParams,
    options: ApiRequestOptions = {},
  ): Promise<CalendarMonthView> {
    const queryParams: Record<string, string | number> = {
      year: params.year,
      month: params.month,
    }

    if (typeof params.projectId === 'number') {
      queryParams.projectId = params.projectId
    }

    return api.get(`/calendar/month-view${buildQuery(queryParams)}`, options)
  },
}
