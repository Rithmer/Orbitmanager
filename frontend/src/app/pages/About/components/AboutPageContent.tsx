import { AboutPageView } from '@/app/pages/About/components/AboutPageView'
import { useAboutPageController } from '@/app/pages/About/hooks/useAboutPageController'

export function AboutPageContent() {
  const model = useAboutPageController()
  return <AboutPageView model={model} />
}
