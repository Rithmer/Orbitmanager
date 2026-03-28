/** Задача на диаграмме дедлайнов отчёта (Gantt) */
export type GanttTask = {
  id: number
  projectId: number
  name: string
  deadline: string
}
