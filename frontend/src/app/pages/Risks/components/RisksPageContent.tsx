import { useRisksPageController } from '@/app/pages/Risks/hooks/useRisksPageController'
import { RisksPageView } from '@/app/pages/Risks/components/RisksPageView'

export function RisksPageContent() {
  const model = useRisksPageController()
  return <RisksPageView model={model} />
}
