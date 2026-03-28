import { ProjectsCreateProjectModal } from './ProjectsCreateProjectModal'
import { ProjectsEditProjectModal } from './ProjectsEditProjectModal'
import { ProjectsMembersModal } from './ProjectsMembersModal'
import type { ProjectsPageModalsProps } from '@/app/pages/Projects/types'

export function ProjectsPageModals({ vm }: ProjectsPageModalsProps) {
  return (
    <>
      <ProjectsCreateProjectModal vm={vm} />
      <ProjectsEditProjectModal vm={vm} />
      <ProjectsMembersModal vm={vm} />
    </>
  )
}
