import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { PageSection } from '@/app/components/PageShell'
import type { ReportsStatusDistributionItem } from '@/app/features/reports'
import type { ReportsThemeTokens } from '@/app/pages/Reports/hooks/useReportsThemeTokens'

type ReportsStatusPieSectionProps = {
  tokens: ReportsThemeTokens
  statusDistribution: ReportsStatusDistributionItem[]
  statusTotal: number
}

export function ReportsStatusPieSection({ tokens, statusDistribution, statusTotal }: ReportsStatusPieSectionProps) {
  return (
    <PageSection title="Статус задач" className={`card-hover ${tokens.cardBg} border ${tokens.cardBorder}`}>
      <div style={{ height: 280 }}>
        {statusDistribution.length === 0 ? (
          <p className={`text-sm ${tokens.textSecondary} text-center py-10`}>Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="45%"
                outerRadius={84}
                label={(d) => `${Math.round((d.percent ?? 0) * 100)}%`}
              >
                {statusDistribution.map((entry: ReportsStatusDistributionItem) => (
                  <Cell key={entry.label} fill={entry.color} />
                ))}
              </Pie>
              <Legend />
              <Tooltip contentStyle={tokens.tooltipStyle} formatter={(value: number) => `${value} шт.`} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <p className={`text-xs ${tokens.textSecondary} mt-2`}>Всего задач: {statusTotal}</p>
    </PageSection>
  )
}
