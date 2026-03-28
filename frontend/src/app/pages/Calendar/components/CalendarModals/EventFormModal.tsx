import { useEffect, useState } from 'react'
import { ErrorMessage, InputField, Modal, SelectField, SubmitButton } from '@/app/components/Modal'
import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import type { CalendarEventFormValues, EventFormModalProps } from '@/app/pages/Calendar/types'

function valuesFromInitial(initial: CalendarEventFormValues): CalendarEventFormValues {
  return { ...initial }
}

export function EventFormModal(props: EventFormModalProps) {
  const { open, title, submitLabel, ui, resetSessionId, initialValues, projectOptions, onClose, onSubmit } = props
  const { isDark, textSecondary } = ui

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formDuration, setFormDuration] = useState('60')
  const [formProjectId, setFormProjectId] = useState('')
  const [formColor, setFormColor] = useState('#3b82f6')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!open) return
    const v = valuesFromInitial(initialValues)
    setFormTitle(v.title)
    setFormDesc(v.description)
    setFormDate(v.date)
    setFormTime(v.time)
    setFormDuration(v.duration)
    setFormProjectId(v.projectId)
    setFormColor(v.color)
    setFormAllDay(v.allDay)
    setFormError('')
  }, [open, resetSessionId, initialValues])

  const handleSubmit = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await onSubmit({
        title: formTitle,
        description: formDesc,
        date: formDate,
        time: formTime,
        duration: formDuration,
        projectId: formProjectId,
        color: formColor,
        allDay: formAllDay,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <ErrorMessage message={formError} />
      <form onSubmit={(e) => { e.preventDefault(); void handleSubmit() }} className="space-y-4">
        <InputField label="Название" value={formTitle} onChange={setFormTitle} required />
        <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
        <InputField label="Дата" value={formDate} onChange={setFormDate} type="date" required />
        <InputField label="Время начала" value={formTime} onChange={setFormTime} type="time" required />
        <SelectField label="Продолжительность" value={formDuration} onChange={setFormDuration} options={[...CALENDAR_PAGE_CONSTANTS.DURATION_OPTIONS]} />
        <SelectField label="Проект (необязательно)" value={formProjectId} onChange={setFormProjectId} options={projectOptions} />
        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${isDark ? 'text-[#94a3b8]' : 'text-[#737373]'}`}>Цвет</label>
          <div className="flex gap-2 flex-wrap">
            {CALENDAR_PAGE_CONSTANTS.EVENT_COLORS.map((c) => (
              <button key={c.value} type="button" onClick={() => setFormColor(c.value)} className={`w-8 h-8 rounded-full transition-all ${formColor === c.value ? 'ring-2 ring-offset-2 ring-[#4880ff]' : ''}`} style={{ backgroundColor: c.value }} title={c.label} />
            ))}
          </div>
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={formAllDay} onChange={(e) => setFormAllDay(e.target.checked)} />
          <span>Весь день</span>
        </label>
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
          <SubmitButton loading={formLoading}>{submitLabel}</SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
