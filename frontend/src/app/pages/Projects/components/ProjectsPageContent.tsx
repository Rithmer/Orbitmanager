import { Navigate } from 'react-router'
import { PageShell } from '@/app/components/PageShell'
import { useProjectsPageController } from '@/app/pages/Projects/hooks/useProjectsPageController'
import { ProjectsMainSection } from '@/app/pages/Projects/components/ProjectsMainSection'
import { ProjectsPageModals } from '@/app/pages/Projects/components/ProjectsPageModals'
import { ProjectsPageNewProjectButton } from '@/app/pages/Projects/components/ProjectsPageNewProjectButton'
import { ProjectsPagination } from '@/app/pages/Projects/components/ProjectsPagination'

export function ProjectsPageContent() {
  const vm = useProjectsPageController()

  if (!vm.shell.projectsSectionAccess.isLoading && !vm.shell.projectsSectionAccess.allowed) {
    return <Navigate to="/" replace />
  }

  return (
    <PageShell
      title="Проекты"
      description="Серверная пагинация, компактная карточка проекта и ленивые модальные списки."
      actions={<ProjectsPageNewProjectButton onClick={vm.projectForm.openCreateModal} />}
    >
      <ProjectsMainSection vm={vm} />
      <ProjectsPagination
        page={vm.list.page}
        totalPages={vm.list.totalPages}
        textSecondary={vm.shell.theme.textSecondary}
        onPageChange={vm.list.updatePage}
      />
      <ProjectsPageModals vm={vm} />
    </PageShell>
  )
}
