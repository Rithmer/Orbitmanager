import { ArrowUpRight, type LucideIcon } from 'lucide-react'
import { PageRefreshOverlay } from '@/app/components/PageShell'

type DashboardStat = {
  label: string
  value: string
  change: string
  icon: LucideIcon
  iconBg: string
  iconColor: string
}

type DashboardStatsSectionProps = {
  stats: DashboardStat[]
  isRefreshing: boolean
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
}

export function DashboardStatsSection({
  stats,
  isRefreshing,
  cardBg,
  cardBorder,
  textPrimary,
  textSecondary,
}: DashboardStatsSectionProps) {
  return (
    <PageRefreshOverlay show={isRefreshing} label="Сводка обновляется" className="mb-6 md:mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 stagger-row">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={`${cardBg} border ${cardBorder} rounded-xl p-5 card-hover-shadow stagger-card`}
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</div>
                <div className={`text-sm ${textSecondary}`}>{stat.label}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className={`text-xs ${textSecondary}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>
    </PageRefreshOverlay>
  )
}
