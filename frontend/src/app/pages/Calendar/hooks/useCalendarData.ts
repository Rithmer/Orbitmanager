import { useCallback, useEffect, useState } from 'react'
import { calendarApi } from '@/app/api/calendar'
import { projectsApi } from '@/app/api/projects'
import { tasksApi } from '@/app/api/tasks'
import type { CalendarEvent, Project, Task } from '@/app/types'
import { getCalendarFallbackErrorMessage } from '@/app/pages/Calendar/helpers'

export function useCalendarData(currentYear: number, currentMonth: number) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadStaticData = useCallback(async () => {
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.list({ limit: 500 }).catch(() => {
          setError(getCalendarFallbackErrorMessage('tasks'))
          return { items: [] as Task[], total: 0, page: 1, limit: 500, totalPages: 0 }
        }),
        projectsApi.list({ limit: 100 }).catch(() => {
          setError(getCalendarFallbackErrorMessage('projects'))
          return { items: [] as Project[], total: 0, page: 1, limit: 100, totalPages: 0 }
        }),
      ])
      setTasks(tasksRes.items)
      setProjects(projectsRes.items)
    } catch {
      setError('Не удалось загрузить данные календаря. Попробуйте обновить страницу.')
    }
  }, [])

  const loadEvents = useCallback(async () => {
    try {
      const from = new Date(currentYear, currentMonth - 1, 1).toISOString()
      const to = new Date(currentYear, currentMonth, 0, 23, 59, 59).toISOString()
      const eventsRes = await calendarApi.list({ limit: 500, from, to }).catch(() => {
        setError(getCalendarFallbackErrorMessage('events'))
        return { items: [] as CalendarEvent[], total: 0, page: 1, limit: 500, totalPages: 0 }
      })
      setEvents(eventsRes.items)
    } catch {
      setError('Не удалось загрузить события календаря. Попробуйте обновить страницу.')
    }
  }, [currentYear, currentMonth])

  const loadData = useCallback(async () => {
    setError('')
    try {
      await Promise.all([loadStaticData(), loadEvents()])
    } finally {
      setLoading(false)
    }
  }, [loadEvents, loadStaticData])

  useEffect(() => {
    void loadData()
  }, [loadData])

  return { tasks, events, projects, loading, error, setLoading, loadData, loadEvents }
}
