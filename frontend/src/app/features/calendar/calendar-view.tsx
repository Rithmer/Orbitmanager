import { DAY_NAMES } from './calendar-view.constants'

export function CalendarMonthViewSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-52 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
          <div className="h-4 w-72 max-w-full rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
          <div className="h-10 w-10 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
          <div className="h-10 w-28 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        </div>
      </div>

      <div className="rounded-xl border border-black/5 bg-white shadow-sm dark:border-white/5 dark:bg-[#273142]">
        <div className="grid grid-cols-7 border-b border-black/5 dark:border-white/5">
          {DAY_NAMES.map((dayName) => (
            <div
              key={`skeleton-day-${dayName}`}
              className="py-3 text-center text-xs font-bold uppercase tracking-wider text-transparent"
            >
              {dayName}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {Array.from({ length: 42 }).map((_, index) => (
            <div
              key={`skeleton-cell-${index}`}
              className="min-h-[92px] border-t border-r border-black/5 p-2 dark:border-white/5 md:min-h-[120px]"
            >
              <div className="mb-2 h-6 w-6 rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5" />
              <div className="space-y-1">
                <div className="h-3 w-11/12 rounded skeleton-shimmer bg-black/5 dark:bg-white/5" />
                <div className="h-3 w-3/4 rounded skeleton-shimmer bg-black/5 dark:bg-white/5" />
                {index % 3 === 0 ? (
                  <div className="h-3 w-2/3 rounded skeleton-shimmer bg-black/5 dark:bg-white/5" />
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
