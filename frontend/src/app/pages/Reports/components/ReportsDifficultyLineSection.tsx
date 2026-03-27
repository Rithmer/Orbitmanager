import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { PageSection } from '@/app/components/PageShell'
import type { ReportsThemeTokens } from '@/app/pages/Reports/hooks/useReportsThemeTokens'

type NormalizedDifficultyRow = {
  difficulty: number
  label: string
  value: number
}

type ReportsDifficultyLineSectionProps = {
  tokens: ReportsThemeTokens
  normalizedDifficultyDistribution: NormalizedDifficultyRow[]
}

export function ReportsDifficultyLineSection({ tokens, normalizedDifficultyDistribution }: ReportsDifficultyLineSectionProps) {
  return (
    <PageSection title="Распределение по сложности" className={`card-hover ${tokens.cardBg} border ${tokens.cardBorder}`}>
      <div style={{ height: 228 }} className="px-2 pt-2">
        {normalizedDifficultyDistribution.length === 0 ? (
          <p className={`text-sm ${tokens.textSecondary} text-center py-10`}>Нет данных</p>
        ) : (
          <ResponsiveContainer width="100%" height={212}>
            <LineChart data={normalizedDifficultyDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke={tokens.gridColor} />
              <XAxis dataKey="label" tick={{ fill: tokens.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tokens.axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tokens.tooltipStyle} />
              <Line type="monotone" dataKey="value" stroke="#4880ff" strokeWidth={2.5} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </PageSection>
  )
}
