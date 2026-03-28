import { useState } from 'react'
import { calendarApi } from '@/app/api/calendar'
import type { CalendarEvent } from '@/app/types'

type UseCalendarEventFormArgs = {
  currentYear: number
  currentMonth: number
  selectedDay: number | null
  today: Date
  events: CalendarEvent[]
  onEventsUpdated: () => Promise<void>
}

export function useCalendarEventForm({
  currentYear,
  currentMonth,
  selectedDay,
  today,
  events,
  onEventsUpdated,
}: UseCalendarEventFormArgs) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null)
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDate, setFormDate] = useState('')
  const [formTime, setFormTime] = useState('09:00')
  const [formDuration, setFormDuration] = useState('60')
  const [formColor, setFormColor] = useState('#3b82f6')
  const [formProjectId, setFormProjectId] = useState('')
  const [formAllDay, setFormAllDay] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const openCreateForDay = (day?: number) => {
    const d = day || selectedDay || today.getDate()
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setFormTitle('')
    setFormDesc('')
    setFormDate(dateStr)
    setFormTime('09:00')
    setFormDuration('60')
    setFormColor('#3b82f6')
    setFormProjectId('')
    setFormAllDay(false)
    setFormError('')
    setShowCreateModal(true)
  }

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      const startDate = new Date(`${formDate}T${formTime}:00`).toISOString()
      const endDate = new Date(new Date(`${formDate}T${formTime}:00`).getTime() + Number(formDuration) * 60000).toISOString()
      await calendarApi.create({
        title: formTitle,
        description: formDesc || undefined,
        startDate,
        endDate,
        color: formColor,
        projectId: formProjectId ? Number(formProjectId) : undefined,
        allDay: formAllDay,
      })
      setShowCreateModal(false)
      await onEventsUpdated()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setFormLoading(false)
    }
  }

  const openEditEvent = (eventId: number) => {
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    setEditingEvent(ev)
    const start = new Date(ev.startDate)
    setFormTitle(ev.title)
    setFormDesc(ev.description || '')
    setFormDate(`${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`)
    setFormTime(start.toTimeString().slice(0, 5))
    const diffMin = Math.round((new Date(ev.endDate).getTime() - start.getTime()) / 60000)
    setFormDuration(String(diffMin))
    setFormColor(ev.color)
    setFormProjectId(ev.projectId ? String(ev.projectId) : '')
    setFormAllDay(ev.allDay)
    setFormError('')
    setShowEditModal(true)
  }

  const handleEdit = async () => {
    if (!editingEvent) return
    setFormLoading(true)
    setFormError('')
    try {
      const startDate = new Date(`${formDate}T${formTime}:00`).toISOString()
      const endDate = new Date(new Date(`${formDate}T${formTime}:00`).getTime() + Number(formDuration) * 60000).toISOString()
      await calendarApi.update(editingEvent.id, {
        title: formTitle,
        description: formDesc,
        startDate,
        endDate,
        color: formColor,
        projectId: formProjectId ? Number(formProjectId) : null,
        allDay: formAllDay,
      })
      setShowEditModal(false)
      setEditingEvent(null)
      await onEventsUpdated()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteEvent = async (eventId: number) => {
    if (!confirm('Удалить событие?')) return
    try {
      await calendarApi.delete(eventId)
      await onEventsUpdated()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  return {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    setEditingEvent,
    formTitle,
    setFormTitle,
    formDesc,
    setFormDesc,
    formDate,
    setFormDate,
    formTime,
    setFormTime,
    formDuration,
    setFormDuration,
    formColor,
    setFormColor,
    formProjectId,
    setFormProjectId,
    formAllDay,
    setFormAllDay,
    formLoading,
    formError,
    openCreateForDay,
    handleCreate,
    openEditEvent,
    handleEdit,
    handleDeleteEvent,
  }
}
