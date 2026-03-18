import { PageSectionSkeleton } from '../../components/PageShell'

export function CalendarMonthViewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="h-8 w-48 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        <div className="h-10 w-40 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
      </div>
      <div className="rounded-xl border border-black/5 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-[#273142]">
        <PageSectionSkeleton rows={5} />
      </div>
    </div>
  )
}
