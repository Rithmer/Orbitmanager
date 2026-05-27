import { useState } from 'react'
import { calendarApi } from '@/app/api/calendar'
import type { CalendarEvent } from '@/app/types'
import type { CalendarEventFormValues } from '@/app/pages/Calendar/types'

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
  const [createSessionId, setCreateSessionId] = useState(0)
  const [editSessionId, setEditSessionId] = useState(0)
  const [createInitial, setCreateInitial] = useState<CalendarEventFormValues>({
    title: '',
    description: '',
    date: '',
    time: '09:00',
    duration: '60',
    color: '#3b82f6',
    projectId: '',
    allDay: false,
  })
  const [editInitial, setEditInitial] = useState<CalendarEventFormValues>({
    title: '',
    description: '',
    date: '',
    time: '09:00',
    duration: '60',
    color: '#3b82f6',
    projectId: '',
    allDay: false,
  })

  const openCreateForDay = (day?: number) => {
    const d = day || selectedDay || today.getDate()
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    setCreateInitial({
      title: '',
      description: '',
      date: dateStr,
      time: '09:00',
      duration: '60',
      color: '#3b82f6',
      projectId: '',
      allDay: false,
    })
    setCreateSessionId((s) => s + 1)
    setShowCreateModal(true)
  }

  const submitCreate = async (values: CalendarEventFormValues) => {
    const startDate = new Date(`${values.date}T${values.time}:00`).toISOString()
    const endDate = new Date(new Date(`${values.date}T${values.time}:00`).getTime() + Number(values.duration) * 60000).toISOString()
    await calendarApi.create({
      title: values.title,
      description: values.description || undefined,
      startDate,
      endDate,
      color: values.color,
      projectId: values.projectId ? Number(values.projectId) : undefined,
      allDay: values.allDay,
    })
    setShowCreateModal(false)
    await onEventsUpdated()
  }

  const openEditEvent = (eventId: number) => {
    const ev = events.find((e) => e.id === eventId)
    if (!ev) return
    setEditingEvent(ev)
    const start = new Date(ev.startDate)
    const diffMin = Math.round((new Date(ev.endDate).getTime() - start.getTime()) / 60000)
    setEditInitial({
      title: ev.title,
      description: ev.description || '',
      date: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
      time: start.toTimeString().slice(0, 5),
      duration: String(diffMin),
      color: ev.color,
      projectId: ev.projectId ? String(ev.projectId) : '',
      allDay: ev.allDay,
    })
    setEditSessionId((s) => s + 1)
    setShowEditModal(true)
  }

  const submitEdit = async (values: CalendarEventFormValues) => {
    const ev = editingEvent
    if (!ev) throw new Error('Событие не выбрано')
    const startDate = new Date(`${values.date}T${values.time}:00`).toISOString()
    const endDate = new Date(new Date(`${values.date}T${values.time}:00`).getTime() + Number(values.duration) * 60000).toISOString()
    await calendarApi.update(ev.id, {
      title: values.title,
      description: values.description,
      startDate,
      endDate,
      color: values.color,
      projectId: values.projectId ? Number(values.projectId) : null,
      allDay: values.allDay,
    })
    setShowEditModal(false)
    setEditingEvent(null)
    await onEventsUpdated()
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
    createSessionId,
    createInitial,
    submitCreate,
    editSessionId,
    editInitial,
    submitEdit,
    openCreateForDay,
    openEditEvent,
    handleDeleteEvent,
  }
}
