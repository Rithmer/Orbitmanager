import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { calendarViewApi } from '@/app/api/calendar-view'
import { appQueryKeys } from '@/app/query'
import type { CalendarMonthViewQueryParams } from '@/app/features/calendar/types'

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
