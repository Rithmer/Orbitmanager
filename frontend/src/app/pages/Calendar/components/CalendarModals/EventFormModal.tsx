import { ErrorMessage, InputField, Modal, SelectField, SubmitButton } from '@/app/components/Modal'
import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import type { EventFormModalProps } from '@/app/pages/Calendar/types'

export function EventFormModal(props: EventFormModalProps) {
  const {
    open,
    title,
    formError,
    formTitle,
    formDesc,
    formDate,
    formTime,
    formDuration,
    formProjectId,
    formColor,
    formAllDay,
    formLoading,
    isDark,
    textSecondary,
    projectOptions,
    onClose,
    onSubmit,
    setFormTitle,
    setFormDesc,
    setFormDate,
    setFormTime,
    setFormDuration,
    setFormProjectId,
    setFormColor,
    setFormAllDay,
  } = props

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <ErrorMessage message={formError} />
      <form onSubmit={(e) => { e.preventDefault(); onSubmit() }} className="space-y-4">
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
          <SubmitButton loading={formLoading}>{title.includes('Редактировать') ? 'Сохранить' : 'Создать'}</SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
