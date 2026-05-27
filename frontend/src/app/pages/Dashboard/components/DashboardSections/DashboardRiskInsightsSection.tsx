import { PageSection, RefreshBadge } from '@/app/components/PageShell'
import { DASHBOARD_PAGE_CONSTANTS } from '@/app/pages/Dashboard/constants'
import type { DashboardRiskInsightsSectionProps } from '@/app/pages/Dashboard/types'

export function DashboardRiskInsightsSection({
  riskInsights,
  isRefreshing,
  ui,
}: DashboardRiskInsightsSectionProps) {
  const { cardBg, cardBorder, textSecondary, insightStyles } = ui

  return (
    <PageSection
      title="AI аналитика рисков"
      description="Оценка задач с наибольшей вероятностью задержки."
      className={`card-hover-shadow ${cardBg} border ${cardBorder} fade-in-up`.trim()}
      isRefreshing={isRefreshing}
      refreshLabel="Обновляем аналитику рисков"
      headerSlot={isRefreshing ? <RefreshBadge isRefreshing label="Обновляем" /> : null}
    >
      {riskInsights.length === 0 ? (
        <p className={`text-sm ${textSecondary} py-8 text-center`}>{DASHBOARD_PAGE_CONSTANTS.risksEmptyMessage}</p>
      ) : (
        <div className="space-y-3">
          {riskInsights.map((insight, index) => {
            const style = insightStyles[insight.type]
            return (
              <div
                key={insight.taskId}
                className={`${style.bg} border ${style.border} rounded-lg p-3.5 stagger-card`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${style.dot} mt-1.5 shrink-0`} />
                  <p className={`text-sm leading-relaxed ${style.text}`}>{insight.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </PageSection>
  )
}
