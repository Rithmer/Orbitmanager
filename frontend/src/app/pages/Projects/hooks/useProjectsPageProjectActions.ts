import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/app/api/projects'
import { appQueryKeys } from '@/app/query'
import { getErrorMessage } from '@/app/utils/errorMessage'
import { ProjectStatus, type Project } from '@/app/types'
import type { ProjectsProjectFormState } from '@/app/pages/Projects/hooks/useProjectsProjectFormState'
import type { ProjectsPageListBlockReturn } from '@/app/pages/Projects/hooks/useProjectsPageListBlock'

type UseProjectsPageProjectActionsParams = {
  projectForm: ProjectsProjectFormState
  projects: Project[]
  setOpenMenuId: ProjectsPageListBlockReturn['setOpenMenuId']
  teamsOptionsQuery: ProjectsPageListBlockReturn['teamsOptionsQuery']
}

export function useProjectsPageProjectActions({
  projectForm,
  projects,
  setOpenMenuId,
  teamsOptionsQuery,
}: UseProjectsPageProjectActionsParams) {
  const queryClient = useQueryClient()

  const invalidateProjectQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: appQueryKeys.projects.root })
  }

  useEffect(() => {
    if (!projectForm.showCreateModal) {
      return
    }

    if (!projectForm.formTeamId && teamsOptionsQuery.data?.items.length) {
      projectForm.setFormTeamId(String(teamsOptionsQuery.data.items[0].id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectForm.showCreateModal,
    projectForm.formTeamId,
    teamsOptionsQuery.data,
    projectForm.setFormTeamId,
  ])

  const openCreateModal = () => {
    projectForm.setFormName('')
    projectForm.setFormDescription('')
    projectForm.setFormTeamId('')
    projectForm.setFormStatus(ProjectStatus.ACTIVE)
    projectForm.setFormError('')
    projectForm.setShowCreateModal(true)
  }

  const openEditModal = (projectId: number) => {
    const project = projects.find((item) => item.id === projectId)
    if (!project) {
      return
    }

    projectForm.setEditingProjectId(projectId)
    projectForm.setFormName(project.name)
    projectForm.setFormDescription(project.description || '')
    projectForm.setFormStatus(project.status)
    projectForm.setFormError('')
    projectForm.setShowEditModal(true)
  }

  const handleCreateProject = async () => {
    projectForm.setFormLoading(true)
    projectForm.setFormError('')

    try {
      await projectsApi.create({
        name: projectForm.formName.trim(),
        description: projectForm.formDescription.trim() || undefined,
        teamId: Number(projectForm.formTeamId),
        status: projectForm.formStatus,
      })
      projectForm.setShowCreateModal(false)
      await invalidateProjectQueries()
    } catch (error) {
      projectForm.setFormError(getErrorMessage(error, 'Не удалось создать проект'))
    } finally {
      projectForm.setFormLoading(false)
    }
  }

  const handleEditProject = async () => {
    if (projectForm.editingProjectId === null) {
      return
    }

    projectForm.setFormLoading(true)
    projectForm.setFormError('')

    try {
      await projectsApi.update(projectForm.editingProjectId, {
        name: projectForm.formName.trim(),
        description: projectForm.formDescription.trim() || undefined,
        status: projectForm.formStatus,
      })
      projectForm.setShowEditModal(false)
      projectForm.setEditingProjectId(null)
      await invalidateProjectQueries()
    } catch (error) {
      projectForm.setFormError(getErrorMessage(error, 'Не удалось обновить проект'))
    } finally {
      projectForm.setFormLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Удалить проект?')) {
      return
    }

    projectForm.setPendingDeleteProjectId(projectId)
    try {
      await projectsApi.delete(projectId)
      setOpenMenuId(null)
      await invalidateProjectQueries()
    } catch (error) {
      alert(getErrorMessage(error, 'Не удалось удалить проект'))
    } finally {
      projectForm.setPendingDeleteProjectId((currentId) =>
        currentId === projectId ? null : currentId,
      )
    }
  }

  return {
    openCreateModal,
    openEditModal,
    handleCreateProject,
    handleEditProject,
    handleDeleteProject,
  }
}
