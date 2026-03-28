import { useReportsPageController } from '@/app/pages/Reports/hooks/useReportsPageController'
import { ReportsPageView } from '@/app/pages/Reports/components/ReportsPageView'

export function ReportsPageContent() {
  const controller = useReportsPageController()
  return <ReportsPageView controller={controller} />
}
