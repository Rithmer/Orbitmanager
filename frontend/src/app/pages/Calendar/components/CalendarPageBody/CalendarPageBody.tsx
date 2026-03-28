import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import type { CalendarPageReadyViewModel } from '@/app/pages/Calendar/types'
import { CalendarFilters } from './CalendarFilters'
import { CalendarGrid } from './CalendarGrid'
import { CalendarHeader } from './CalendarHeader'

type CalendarPageBodyProps = {
  model: CalendarPageReadyViewModel
}

export function CalendarPageBody({ model }: CalendarPageBodyProps) {
  const { ui, form } = model

  return (
    <>
      <CalendarHeader
        ui={ui}
        title={model.headerTitle}
        subtitle="Дедлайны задач и события на календаре"
        canManageCalendar={model.canManageCalendar}
        onPrevMonth={model.onPrevMonth}
        onNextMonth={model.onNextMonth}
        onCreateEvent={() => form.openCreateForDay()}
      />
      <CalendarFilters
        ui={ui}
        filterType={model.filterType}
        filterButtons={CALENDAR_PAGE_CONSTANTS.FILTER_BUTTONS}
        onChange={model.setFilterType}
      />
      <CalendarGrid
        ui={ui}
        cells={model.cells}
        getItemsForDate={model.getItemsForDate}
        getEventColorById={model.getEventColorById}
        isToday={model.isToday}
        onSelectDay={model.setSelectedDay}
      />
    </>
  )
}
