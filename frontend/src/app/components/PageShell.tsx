import { LoaderCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTheme } from '../context/useTheme'

interface PageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children?: ReactNode
  className?: string
}

interface PageSectionProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
  headerSlot?: ReactNode
  isRefreshing?: boolean
  refreshLabel?: string
}

interface PageSkeletonRowProps {
  className?: string
}

interface PageShellSectionSkeletonProps {
  rows?: number
  cards?: number
}

interface RefreshBadgeProps {
  isRefreshing?: boolean
  label?: string
  className?: string
}

interface PageRefreshOverlayProps {
  show?: boolean
  label?: string
  className?: string
  children: ReactNode
}

interface PageToolbarSkeletonProps {
  showMeta?: boolean
}

interface StatCardsSkeletonProps {
  count?: number
  className?: string
}

interface AnalyticsChartSkeletonProps {
  heightClassName?: string
  className?: string
}

interface CardGridSkeletonProps {
  count?: number
  variant?: 'project' | 'team'
  className?: string
}

export function PageShell({
  title,
  description,
  actions,
  children,
  className = '',
}: PageShellProps) {
  const { isDark } = useTheme()
  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8 ${className}`.trim()}>
      <div className="mb-6 md:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>{title}</h1>
          {description && <p className={`mt-1 text-sm ${textSecondary}`}>{description}</p>}
        </div>
        {actions ? <div className="self-start sm:self-auto">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

export function PageSection({
  title,
  description,
  children,
  className = '',
  headerSlot,
  isRefreshing = false,
  refreshLabel = 'Обновление данных',
}: PageSectionProps) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const section = (
    <section className={`${cardBg} border ${cardBorder} rounded-xl p-6 ${className}`.trim()}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className={`font-bold ${textPrimary}`}>{title}</h2>
          {description && <p className={`mt-1 text-sm ${textSecondary}`}>{description}</p>}
        </div>
        {headerSlot ? <div className="self-start sm:self-auto">{headerSlot}</div> : null}
      </div>
      {children}
    </section>
  )

  if (!isRefreshing) {
    return section
  }

  return (
    <PageRefreshOverlay show={isRefreshing} label={refreshLabel}>
      {section}
    </PageRefreshOverlay>
  )
}

export function RefreshBadge({
  isRefreshing = false,
  label = 'Обновление данных',
  className = '',
}: RefreshBadgeProps) {
  const { isDark } = useTheme()

  if (!isRefreshing) {
    return null
  }

  const badgeBg = isDark ? 'bg-[#1e2a3a]/95 border-[#313d4f]' : 'bg-white/95 border-black/10'
  const badgeText = isDark ? 'text-[#94a3b8]' : 'text-[#565656]'

  return (
    <div
      className={`fade-in-down inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm ${badgeBg} ${badgeText} ${className}`.trim()}
    >
      <LoaderCircle className="h-3.5 w-3.5 animate-spin text-[#4880ff]" />
      <span>{label}</span>
    </div>
  )
}

export function PageRefreshOverlay({
  show = false,
  label = 'Обновление данных',
  className = '',
  children,
}: PageRefreshOverlayProps) {
  return (
    <div className={`page-refresh-shell relative overflow-hidden ${className}`.trim()}>
      <div className={`transition-opacity duration-300 ${show ? 'opacity-75' : 'opacity-100'}`}>
        {children}
      </div>
      {show ? (
        <div className="page-refresh-overlay pointer-events-none">
          <div className="absolute right-3 top-3">
            <RefreshBadge isRefreshing label={label} />
          </div>
        </div>
      ) : null}
    </div>
  )
}

function SkeletonBlock({ className }: { className: string }) {
  return <div className={`${className} skeleton-shimmer bg-black/5 dark:bg-white/5`.trim()} />
}

export function PageShellHeaderSkeleton({
  showAction = true,
}: {
  showAction?: boolean
}) {
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

export function PageShellSectionSkeleton({
  rows = 3,
  cards = 3,
}: PageShellSectionSkeletonProps) {
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

export function PageSectionSkeleton({
  rows = 3,
}: PageShellSectionSkeletonProps) {
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

export function PageToolbarSkeleton({
  showMeta = true,
}: PageToolbarSkeletonProps) {
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

export function StatCardsSkeleton({
  count = 4,
  className = '',
}: StatCardsSkeletonProps) {
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
      <div className={`rounded-xl border border-dashed border-black/10 px-4 py-5 dark:border-white/10 ${heightClassName}`.trim()}>
        <div className="flex h-full items-end gap-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonBlock
              key={`chart-bar-skeleton-${index}`}
              className={`w-full rounded-t-xl ${
                index % 3 === 0
                  ? 'h-[72%]'
                  : index % 3 === 1
                    ? 'h-[46%]'
                    : 'h-[58%]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
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
