import { PageShell, StatCardsSkeleton } from '@/app/components/PageShell'

type DashboardSkeletonStateProps = {
  firstName: string
  cardBg: string
  cardBorder: string
}

function DashboardListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`dashboard-task-skeleton-${index}`}
          className="flex items-center gap-4 rounded-xl border border-black/5 bg-black/5 px-4 py-3 dark:border-white/5 dark:bg-white/5"
        >
          <div className="h-2.5 w-2.5 rounded-full skeleton-shimmer bg-black/10 dark:bg-white/10" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-2/3 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-1/2 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
          </div>
          <div className="h-6 w-20 rounded-full skeleton-shimmer bg-black/10 dark:bg-white/10" />
        </div>
      ))}
    </div>
  )
}

function DashboardInsightSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={`dashboard-insight-skeleton-${index}`}
          className="rounded-xl border border-black/5 bg-black/5 p-4 dark:border-white/5 dark:bg-white/5"
        >
          <div className="space-y-2">
            <div className="h-4 w-4/5 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
            <div className="h-3 w-2/3 rounded-lg skeleton-shimmer bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function DashboardSkeletonState({ firstName, cardBg, cardBorder }: DashboardSkeletonStateProps) {
  return (
    <PageShell title={`Добро пожаловать, ${firstName}!`} description="Подготавливаем сводку по задачам, проектам и рискам.">
      <div className="space-y-6">
        <StatCardsSkeleton count={4} />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className={`xl:col-span-2 rounded-xl border ${cardBorder} ${cardBg} p-6 shadow-sm`}>
            <div className="mb-4 space-y-2">
              <div className="h-5 w-40 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
              <div className="h-4 w-72 max-w-full rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
            </div>
            <DashboardListSkeleton />
          </div>
          <div className={`rounded-xl border ${cardBorder} ${cardBg} p-6 shadow-sm`}>
            <div className="mb-4 space-y-2">
              <div className="h-5 w-36 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
              <div className="h-4 w-56 max-w-full rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
            </div>
            <DashboardInsightSkeleton />
          </div>
        </div>
      </div>
    </PageShell>
  )
}
