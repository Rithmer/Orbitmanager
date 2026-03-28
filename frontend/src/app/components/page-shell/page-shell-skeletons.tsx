import { PageSection } from '@/app/components/page-shell/page-shell-core'

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`${className} skeleton-shimmer bg-black/5 dark:bg-white/5`.trim()} />
}

export interface PageSkeletonRowProps {
  className?: string
}

export function PageSkeletonRow({ className = '' }: PageSkeletonRowProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <SkeletonBlock className="h-10 w-10 rounded-full" />
      <div className="min-w-0 flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-1/2 rounded-lg" />
        <SkeletonBlock className="h-3 w-2/3 rounded-lg" />
      </div>
      <SkeletonBlock className="h-8 w-24 rounded-lg" />
    </div>
  )
}

export interface PageShellSectionSkeletonProps {
  rows?: number
  cards?: number
}

export function PageShellHeaderSkeleton({ showAction = true }: { showAction?: boolean }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
      <div className="space-y-2">
        <SkeletonBlock className="h-7 w-44 rounded-lg" />
        <SkeletonBlock className="h-4 w-72 max-w-full rounded-lg" />
      </div>
      {showAction ? <SkeletonBlock className="h-10 w-40 rounded-lg" /> : null}
    </div>
  )
}

export function PageShellSectionSkeleton({ rows = 3, cards = 3 }: PageShellSectionSkeletonProps) {
  return (
    <div className="grid gap-4">
      <StatCardsSkeleton count={cards} />
      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#273142]">
        <div className="space-y-3">
          {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
            <PageSkeletonRow key={`row-skeleton-${index}`} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function PageSectionSkeleton({ rows = 3 }: PageShellSectionSkeletonProps) {
  return (
    <PageSection title=" " className="animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: Math.max(1, rows) }).map((_, index) => (
          <PageSkeletonRow key={`section-row-skeleton-${index}`} />
        ))}
      </div>
    </PageSection>
  )
}

export interface PageToolbarSkeletonProps {
  showMeta?: boolean
}

export function PageToolbarSkeleton({ showMeta = true }: PageToolbarSkeletonProps) {
  return (
    <div className="mb-6">
      <SkeletonBlock className="h-11 w-full rounded-xl" />
      {showMeta ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <SkeletonBlock className="h-3 w-20 rounded-full" />
          <SkeletonBlock className="h-3 w-28 rounded-full" />
        </div>
      ) : null}
    </div>
  )
}

export interface StatCardsSkeletonProps {
  count?: number
  className?: string
}

export function StatCardsSkeleton({ count = 4, className = '' }: StatCardsSkeletonProps) {
  return (
    <div className={`grid grid-cols-2 gap-3 md:gap-5 xl:grid-cols-4 ${className}`.trim()}>
      {Array.from({ length: Math.max(1, count) }).map((_, index) => (
        <div
          key={`stat-card-skeleton-${index}`}
          className="rounded-xl border border-black/5 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#273142]"
        >
          <div className="flex items-center gap-4">
            <SkeletonBlock className="h-12 w-12 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-7 w-16 rounded-lg" />
              <SkeletonBlock className="h-4 w-24 rounded-lg" />
            </div>
          </div>
          <SkeletonBlock className="mt-4 h-3 w-28 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export interface AnalyticsChartSkeletonProps {
  heightClassName?: string
  className?: string
}

export function AnalyticsChartSkeleton({
  heightClassName = 'h-[240px]',
  className = '',
}: AnalyticsChartSkeletonProps) {
  return (
    <div
      className={`rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#273142] ${className}`.trim()}
    >
      <div className="mb-4 space-y-2">
        <SkeletonBlock className="h-5 w-40 rounded-lg" />
        <SkeletonBlock className="h-4 w-56 rounded-lg max-w-full" />
      </div>
      <div
        className={`rounded-xl border border-dashed border-black/10 px-4 py-5 dark:border-white/10 ${heightClassName}`.trim()}
      >
        <div className="flex h-full items-end gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock
              key={`chart-bar-skeleton-${index}`}
              className={`w-full rounded-t-xl ${
                index % 3 === 0 ? 'h-[72%]' : index % 3 === 1 ? 'h-[46%]' : 'h-[58%]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export interface CardGridSkeletonProps {
  count?: number
  variant?: 'project' | 'team'
  className?: string
}

export function PageCardGridSkeleton({
  count = 6,
  variant = 'project',
  className = '',
}: CardGridSkeletonProps) {
  return (
    <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 ${className}`.trim()}>
      {Array.from({ length: Math.max(1, count) }).map((_, index) => (
        <div
          key={`card-grid-skeleton-${variant}-${index}`}
          className="rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#273142]"
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <SkeletonBlock className="h-11 w-11 rounded-xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-5 w-2/3 rounded-lg" />
                <div className="flex flex-wrap gap-2">
                  <SkeletonBlock className="h-5 w-16 rounded-full" />
                  <SkeletonBlock className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
            <SkeletonBlock className="h-8 w-8 rounded-lg" />
          </div>

          {variant === 'project' ? (
            <>
              <div className="mb-4 space-y-2">
                <SkeletonBlock className="h-4 w-full rounded-lg" />
                <SkeletonBlock className="h-4 w-4/5 rounded-lg" />
              </div>
              <div className="border-t border-black/5 pt-4 dark:border-white/5">
                <div className="flex items-center justify-between gap-3">
                  <SkeletonBlock className="h-4 w-24 rounded-lg" />
                  <div className="flex gap-3">
                    <SkeletonBlock className="h-4 w-14 rounded-lg" />
                    <SkeletonBlock className="h-4 w-12 rounded-lg" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-black/5 p-3 dark:bg-white/5">
                  <SkeletonBlock className="h-4 w-12 rounded-lg" />
                  <SkeletonBlock className="mt-2 h-3 w-16 rounded-lg" />
                </div>
                <div className="rounded-lg bg-black/5 p-3 dark:bg-white/5">
                  <SkeletonBlock className="h-4 w-16 rounded-lg" />
                  <SkeletonBlock className="mt-2 h-3 w-14 rounded-lg" />
                </div>
              </div>
              <div className="border-t border-black/5 pt-4 dark:border-white/5">
                <SkeletonBlock className="mb-3 h-3 w-24 rounded-full" />
                <div className="space-y-2.5">
                  {Array.from({ length: 3 }).map((__, rowIndex) => (
                    <PageSkeletonRow key={`team-card-row-${index}-${rowIndex}`} className="gap-2.5" />
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  )
}
