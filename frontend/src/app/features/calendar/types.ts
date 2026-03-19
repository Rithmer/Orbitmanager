export interface CalendarViewProject {
  id: number
  name: string
  teamId: number
}

export interface CalendarViewTask {
  id: number
  projectId: number
  projectName: string
  name: string
  description: string
  deadline: string
  status: string
  difficulty: number
}

export interface CalendarViewEvent {
  id: number
  userId: number
  projectId: number | null
  projectName: string | null
  taskId: number | null
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  color: string
}

export interface CalendarMonthViewQueryParams {
  year: number
  month: number
  projectId?: number | null
}

export interface CalendarMonthView {
  year: number
  month: number
  projects: CalendarViewProject[]
  tasks: CalendarViewTask[]
  events: CalendarViewEvent[]
}
