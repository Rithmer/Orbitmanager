import { AnalyticsChartSkeleton, PageToolbarSkeleton, PageShell } from '@/app/components/PageShell'

export function ReportsInitialLoadingShell() {
  return (
    <PageShell title="Аналитика" description="Подготавливаем сводку эффективности и распределений.">
      <div className="space-y-6">
        <PageToolbarSkeleton />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <AnalyticsChartSkeleton className="xl:col-span-2" heightClassName="h-[240px]" />
          <AnalyticsChartSkeleton heightClassName="h-[280px]" />
        </div>
        <AnalyticsChartSkeleton heightClassName="h-[200px]" />
      </div>
    </PageShell>
  )
}
