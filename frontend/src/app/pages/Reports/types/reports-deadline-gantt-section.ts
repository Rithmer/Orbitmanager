import type { ReportsThemeTokens } from '@/app/pages/Reports/hooks/useReportsThemeTokens'
import type { GanttTask } from './reports'

export type ReportsDeadlineGanttSectionProps = {
  tokens: ReportsThemeTokens
  isDark: boolean
  ganttTasks: GanttTask[]
  todayStart: number
  maxDeadline: number
  onNavigateToBoard: (projectId: number) => void
}
