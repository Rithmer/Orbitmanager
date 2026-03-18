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
}

interface PageSkeletonRowProps {
  className?: string
}

interface PageShellSectionSkeletonProps {
  rows?: number
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
}: PageSectionProps) {
  const { isDark } = useTheme()
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  return (
    <section className={`${cardBg} border ${cardBorder} rounded-xl p-6 ${className}`.trim()}>
      <div className="mb-4">
        <h2 className={`font-bold ${textPrimary}`}>{title}</h2>
        {description && <p className={`mt-1 text-sm ${textSecondary}`}>{description}</p>}
      </div>
      {children}
    </section>
  )
}

export function PageShellHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 md:mb-8">
      <div className="space-y-2">
        <div className="h-7 w-44 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        <div className="h-4 w-72 max-w-full rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
      </div>
      <div className="h-10 w-40 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
    </div>
  )
}

export function PageShellSectionSkeleton({
  rows = 3,
}: PageShellSectionSkeletonProps) {
  const rowCount = Math.max(1, rows)

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`card-skeleton-${index}`}
            className="rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#273142]"
          >
            <div className="h-4 w-24 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
            <div className="mt-4 h-10 w-full rounded-xl skeleton-shimmer bg-black/5 dark:bg-white/5" />
            <div className="mt-3 h-4 w-3/4 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-black/5 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#273142]">
        <div className="space-y-3">
          {Array.from({ length: rowCount }).map((_, index) => (
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
      <div className="h-10 w-10 rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-4 w-1/2 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        <div className="h-3 w-2/3 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
      </div>
      <div className="h-8 w-24 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
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
