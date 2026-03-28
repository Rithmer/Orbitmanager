import { useDashboardPageController } from '@/app/pages/Dashboard/hooks/useDashboardPageController'
import { DashboardPageView } from '@/app/pages/Dashboard/components/DashboardPageView'

export function DashboardPageContent() {
  const model = useDashboardPageController()
  return <DashboardPageView model={model} />
}
