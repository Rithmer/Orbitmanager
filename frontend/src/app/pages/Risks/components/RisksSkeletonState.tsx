import { PageShell, PageToolbarSkeleton } from '@/app/components/PageShell'
import { RISKS_PAGE_CONSTANTS } from '@/app/pages/Risks/constants'

export function RisksSkeletonState() {
  return (
    <PageShell title={RISKS_PAGE_CONSTANTS.pageTitle} description={RISKS_PAGE_CONSTANTS.loadingDescription}>
      <div className="space-y-6">
        <PageToolbarSkeleton />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="h-56 rounded-2xl skeleton-shimmer bg-black/10 dark:bg-white/10" />
          <div className="h-56 rounded-2xl skeleton-shimmer bg-black/10 dark:bg-white/10" />
          <div className="h-56 rounded-2xl skeleton-shimmer bg-black/10 dark:bg-white/10" />
        </div>
      </div>
    </PageShell>
  )
}
