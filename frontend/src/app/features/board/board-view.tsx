import { PageSectionSkeleton } from '../../components/PageShell'
import { PROJECT_BOARD_COLUMNS } from './board-view.constants'

export function ProjectBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 xl:grid-cols-5">
      {PROJECT_BOARD_COLUMNS.map((column) => (
        <div
          key={column.status}
          className="rounded-xl border border-black/5 bg-white/80 p-4 shadow-sm dark:border-white/5 dark:bg-[#273142]"
        >
          <div className="h-4 w-28 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
          <div className="mt-4 space-y-3">
            <PageSectionSkeleton rows={3} />
          </div>
        </div>
      ))}
    </div>
  )
}
