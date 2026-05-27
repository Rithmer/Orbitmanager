import { PageRefreshOverlay } from '@/app/components/PageShell'
import type { ReportsPageModel } from '@/app/pages/Reports/hooks/useReportsPageModel'
import { ReportsStatusPieSection } from '@/app/pages/Reports/components/ReportsStatusPie'
import { ReportsDeadlineGanttSection } from './ReportsDeadlineGanttSection'

type ReportsChartsGridProps = {
  model: ReportsPageModel
  onNavigateToBoard: (projectId: number) => void
}

export function ReportsChartsGrid({ model, onNavigateToBoard }: ReportsChartsGridProps) {
  const {
    tokens,
    isDark,
    isRefreshing,
    ganttTasks,
    todayStart,
    maxDeadline,
    statusDistribution,
    statusTotal,
  } = model

  return (
    <PageRefreshOverlay show={isRefreshing} label="Обновляем данные" className="mb-4 md:mb-6">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <ReportsDeadlineGanttSection
          tokens={tokens}
          isDark={isDark}
          ganttTasks={ganttTasks}
          todayStart={todayStart}
          maxDeadline={maxDeadline}
          onNavigateToBoard={onNavigateToBoard}
        />
        <ReportsStatusPieSection
          tokens={tokens}
          isDark={isDark}
          statusDistribution={statusDistribution}
          statusTotal={statusTotal}
          isRefreshing={isRefreshing}
        />
      </div>
    </PageRefreshOverlay>
  )
}
