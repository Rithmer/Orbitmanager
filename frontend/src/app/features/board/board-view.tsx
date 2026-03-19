import { PROJECT_BOARD_COLUMNS } from './board-view.constants'

const PROJECT_BOARD_SKELETON_CARD_COUNTS = [4, 5, 4, 5, 3] as const

function BoardTaskSkeleton({ index }: { index: number }) {
  const titleWidth = ['w-5/6', 'w-4/5', 'w-11/12', 'w-3/4'][index % 4]
  const metaWidths = [
    ['w-14', 'w-12'],
    ['w-16', 'w-10'],
    ['w-12', 'w-14'],
    ['w-10', 'w-16'],
  ][index % 4]

  return (
    <article
      className="rounded-xl border border-black/5 bg-white/90 p-3 shadow-sm dark:border-white/5 dark:bg-[#1e2a3a]"
      style={{ animationDelay: `${index * 55}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-2">
          <div className={`h-4 ${titleWidth} rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5`} />
          <div className="flex flex-wrap gap-1.5">
            <div className={`h-5 ${metaWidths[0]} rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5`} />
            <div className="h-5 w-10 rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-3 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        <div className={`h-3 ${metaWidths[1]} rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5`} />
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="h-3 w-20 rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5" />
        <div className="h-3 w-16 rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5" />
      </div>
    </article>
  )
}

function BoardColumnSkeleton({
  column,
  index,
}: {
  column: (typeof PROJECT_BOARD_COLUMNS)[number]
  index: number
}) {
  const cardCount = PROJECT_BOARD_SKELETON_CARD_COUNTS[index % PROJECT_BOARD_SKELETON_CARD_COUNTS.length]

  return (
    <section
      className="rounded-xl border border-black/5 bg-white/80 p-4 shadow-sm dark:border-white/5 dark:bg-[#273142]"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: column.accent }} />
        <div className="h-4 w-24 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5" />
        <span
          className="ml-auto h-5 w-8 rounded-full skeleton-shimmer bg-black/5 dark:bg-white/5"
          aria-hidden="true"
        />
      </div>

      <div className="space-y-3">
        {Array.from({ length: cardCount }).map((_, cardIndex) => (
          <BoardTaskSkeleton key={`${column.status}-skeleton-${cardIndex}`} index={index * 10 + cardIndex} />
        ))}
      </div>
    </section>
  )
}

export function ProjectBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 md:gap-4">
      {PROJECT_BOARD_COLUMNS.map((column, index) => (
        <BoardColumnSkeleton key={column.status} column={column} index={index} />
      ))}
    </div>
  )
}
