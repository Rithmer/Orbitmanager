import { useProjectsPageController } from '@/app/pages/Projects/hooks/useProjectsPageController'
import { ProjectsPageView } from '@/app/pages/Projects/components/ProjectsPageView'

export function ProjectsPageContent() {
  const vm = useProjectsPageController()
  return <ProjectsPageView vm={vm} />
}
