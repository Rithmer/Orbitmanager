export type CalendarProjectOption = { value: string; label: string }

export type EventFormModalProps = {
  open: boolean
  title: string
  formError: string
  formTitle: string
  formDesc: string
  formDate: string
  formTime: string
  formDuration: string
  formProjectId: string
  formColor: string
  formAllDay: boolean
  formLoading: boolean
  isDark: boolean
  textSecondary: string
  projectOptions: CalendarProjectOption[]
  onClose: () => void
  onSubmit: () => void
  setFormTitle: (v: string) => void
  setFormDesc: (v: string) => void
  setFormDate: (v: string) => void
  setFormTime: (v: string) => void
  setFormDuration: (v: string) => void
  setFormProjectId: (v: string) => void
  setFormColor: (v: string) => void
  setFormAllDay: (v: boolean) => void
}
