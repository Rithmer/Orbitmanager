import type { CalItem } from './calendar'
import type { CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type SelectedDayModalProps = {
  ui: CalendarUiTokens
  selectedDay: number | null
  currentMonth: number
  currentYear: number
  selectedDayItems: CalItem[]
  canManageCalendar: boolean
  getDayOfWeek: (day: number) => string
  isToday: (year: number, month: number, day: number) => boolean
  getEventColorById: (eventId: number | undefined) => string
  onClose: () => void
  onCreateForDay: (day: number) => void
  onEditEvent: (eventId: number) => void
  onDeleteEvent: (eventId: number) => void
}
