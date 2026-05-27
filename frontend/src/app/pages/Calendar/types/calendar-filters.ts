import type { EventFilterType } from './calendar'
import type { CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type CalendarFilterButton = { key: EventFilterType; label: string }

export type CalendarFiltersProps = {
  ui: CalendarUiTokens
  filterType: EventFilterType
  filterButtons: readonly CalendarFilterButton[]
  onChange: (value: EventFilterType) => void
}
