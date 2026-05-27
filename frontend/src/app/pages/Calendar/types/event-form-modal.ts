import type { CalendarUiTokens } from '@/app/pages/Calendar/types/calendar-ui-tokens'

export type CalendarProjectOption = { value: string; label: string }

export type CalendarEventFormValues = {
  title: string
  description: string
  date: string
  time: string
  duration: string
  projectId: string
  color: string
  allDay: boolean
}

export type EventFormModalProps = {
  open: boolean
  title: string
  submitLabel: string
  ui: CalendarUiTokens
  resetSessionId: number
  initialValues: CalendarEventFormValues
  projectOptions: CalendarProjectOption[]
  onClose: () => void
  onSubmit: (values: CalendarEventFormValues) => Promise<void>
}
