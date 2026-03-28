import type { ProjectsPageViewModel } from '@/app/pages/Projects/hooks/useProjectsPageController'
import { ProjectsCreateProjectModal } from '@/app/pages/Projects/components/ProjectsCreateProjectModal'
import { ProjectsEditProjectModal } from '@/app/pages/Projects/components/ProjectsEditProjectModal'
import { ProjectsMembersModal } from '@/app/pages/Projects/components/ProjectsMembersModal'

type ProjectsPageModalsProps = {
  vm: ProjectsPageViewModel
}

export function ProjectsPageModals({ vm }: ProjectsPageModalsProps) {
  return (
    <>
      <ProjectsCreateProjectModal vm={vm} />
      <ProjectsEditProjectModal vm={vm} />
      <ProjectsMembersModal vm={vm} />
    </>
  )
}
