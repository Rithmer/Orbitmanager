import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { calendarViewApi } from '../../api/calendar-view'
import { appQueryKeys } from '../../query'
import type { CalendarMonthViewQueryParams } from './types'

export function useCalendarMonthViewQuery(params: CalendarMonthViewQueryParams) {
  const queryParams = {
    year: params.year,
    month: params.month,
    projectId: params.projectId ?? undefined,
  }

  return useQuery({
    queryKey: appQueryKeys.calendar.monthView(queryParams),
    queryFn: ({ signal }) => calendarViewApi.getMonthView(queryParams, { signal }),
    placeholderData: keepPreviousData,
  })
}
