import type { CalendarEvent } from '@/app/types'
import type { CalItem, EventFilterType } from '@/app/pages/Calendar/types/calendar'
import type { CalendarGridCell } from '@/app/pages/Calendar/types/calendar-grid'
import type { CalendarEventFormValues, CalendarProjectOption } from '@/app/pages/Calendar/types/event-form-modal'
import type { CalendarSurfaceTokens, CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type { CalendarSurfaceTokens, CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type CalendarPageSurfaceTokens = CalendarSurfaceTokens

export type CalendarPageFormPort = {
  showCreateModal: boolean
  setShowCreateModal: (v: boolean) => void
  showEditModal: boolean
  setShowEditModal: (v: boolean) => void
  setEditingEvent: (v: CalendarEvent | null) => void
  createSessionId: number
  createInitial: CalendarEventFormValues
  submitCreate: (values: CalendarEventFormValues) => Promise<void>
  editSessionId: number
  editInitial: CalendarEventFormValues
  submitEdit: (values: CalendarEventFormValues) => Promise<void>
  openCreateForDay: (day?: number) => void
  openEditEvent: (eventId: number) => void
  handleDeleteEvent: (eventId: number) => Promise<void>
}

export type CalendarPageReadyViewModel = {
  phase: 'ready'
  ui: CalendarUiTokens
  currentYear: number
  currentMonth: number
  selectedDay: number | null
  setSelectedDay: (v: number | null) => void
  filterType: EventFilterType
  setFilterType: (v: EventFilterType) => void
  canManageCalendar: boolean
  cells: CalendarGridCell[]
  getItemsForDate: (year: number, month: number, day: number) => CalItem[]
  selectedDayItems: CalItem[]
  getDayOfWeek: (day: number) => string
  isToday: (year: number, month: number, day: number) => boolean
  getEventColorById: (eventId: number | undefined) => string
  headerTitle: string
  projectOptions: CalendarProjectOption[]
  form: CalendarPageFormPort
  onPrevMonth: () => void
  onNextMonth: () => void
}

export type CalendarPageViewModel =
  | { phase: 'loading'; tokens: Pick<CalendarSurfaceTokens, 'pageBg'> }
  | { phase: 'error'; tokens: CalendarSurfaceTokens; error: string; onRetry: () => void }
  | CalendarPageReadyViewModel
