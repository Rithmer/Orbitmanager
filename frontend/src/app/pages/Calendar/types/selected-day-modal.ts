import type { CalItem } from './calendar'

export type SelectedDayModalProps = {
  selectedDay: number | null
  currentMonth: number
  currentYear: number
  selectedDayItems: CalItem[]
  canManageCalendar: boolean
  isDark: boolean
  modalBg: string
  textPrimary: string
  textSecondary: string
  getDayOfWeek: (day: number) => string
  isToday: (year: number, month: number, day: number) => boolean
  getEventColorById: (eventId: number | undefined) => string
  onClose: () => void
  onCreateForDay: (day: number) => void
  onEditEvent: (eventId: number) => void
  onDeleteEvent: (eventId: number) => void
}
