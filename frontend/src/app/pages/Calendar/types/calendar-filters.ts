import type { EventFilterType } from './calendar'

export type CalendarFilterButton = { key: EventFilterType; label: string }

export type CalendarFiltersProps = {
  textSecondary: string
  isDark: boolean
  filterType: EventFilterType
  filterButtons: readonly CalendarFilterButton[]
  onChange: (value: EventFilterType) => void
}
