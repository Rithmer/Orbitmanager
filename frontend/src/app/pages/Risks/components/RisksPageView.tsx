import { ApiErrorBanner } from '@/app/components/ApiErrorBanner'
import { PageRefreshOverlay, PageShell } from '@/app/components/PageShell'
import type { useRisksPageController } from '@/app/pages/Risks/hooks/useRisksPageController'
import { RisksSkeletonState, RisksAccessDeniedState, RisksErrorState } from '@/app/pages/Risks/components/RisksStates'
import { RisksNavigatorSection, RisksInsightsSection, RisksToolbarActions } from '@/app/pages/Risks/components/RisksContent'

type RisksPageControllerModel = ReturnType<typeof useRisksPageController>

type RisksPageViewProps = {
  model: RisksPageControllerModel
}

export function RisksPageView({ model }: RisksPageViewProps) {
  const { theme, selection, data, showInitialSkeleton, pageTitle, pageDescription } = model
  const contentPorts = { theme, selection, data }

  if (showInitialSkeleton) {
    return <RisksSkeletonState />
  }

  if (!data.isAdmin && !data.risksAccessLoading && !data.canUseRisks) {
    return <RisksAccessDeniedState textSecondary={theme.textSecondary} />
  }

  return (
    <PageShell
      title={pageTitle}
      description={pageDescription}
      actions={<RisksToolbarActions isRefreshing={data.isRefreshing} onRefresh={() => void data.risksSummaryQuery.refetch()} />}
    >
      <ApiErrorBanner />

      {data.risksSummaryQuery.error && data.cards.length === 0 ? (
        <RisksErrorState
          isMlDown={data.isMlDown}
          textSecondary={theme.textSecondary}
          errorMessage={data.errorMessage}
          onRetry={() => void data.risksSummaryQuery.refetch()}
        />
      ) : (
        <PageRefreshOverlay show={data.isRefreshing} label="Обновляем данные рисков">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <RisksNavigatorSection ports={contentPorts} />
            <RisksInsightsSection ports={contentPorts} />
          </div>
        </PageRefreshOverlay>
      )}
    </PageShell>
  )
}
