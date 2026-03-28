import { useEffect, useMemo } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { projectsApi } from '@/app/api/projects'
import { appQueryKeys } from '@/app/query'
import {
  useProjectMemberUsersQuery,
  useProjectMembersQuery,
  useProjectTeamMembersQuery,
} from '@/app/features/projects'
import { getErrorMessage } from '@/app/utils/errorMessage'
import type { Project } from '@/app/types'
import type { ProjectsMembersModalState } from '@/app/pages/Projects/hooks/useProjectsMembersModalState'
import type { ProjectsProjectFormState } from '@/app/pages/Projects/hooks/useProjectsProjectFormState'
import { useProjectMemberOptions } from '@/app/pages/Projects/hooks/useProjectMemberOptions'

type UseProjectsPageMembersBlockParams = {
  members: ProjectsMembersModalState
  projectForm: ProjectsProjectFormState
  projects: Project[]
}

export function useProjectsPageMembersBlock({
  members,
  projectForm,
  projects,
}: UseProjectsPageMembersBlockParams) {
  const queryClient = useQueryClient()

  const selectedProject =
    projects.find((project) => project.id === members.selectedProjectId) ?? null

  const projectMembersQuery = useProjectMembersQuery(
    members.selectedProjectId,
    members.showMembersModal,
  )
  const projectTeamMembersQuery = useProjectTeamMembersQuery(
    selectedProject?.teamId ?? null,
    members.showMembersModal && members.membersStep === 'add',
  )
  const projectMemberUsersQuery = useProjectMemberUsersQuery(members.showMembersModal)

  const selectedProjectMembers = useMemo(
    () => projectMembersQuery.data ?? [],
    [projectMembersQuery.data],
  )
  const projectMembersLoading = projectMembersQuery.isPending && !projectMembersQuery.data
  const projectMembersError = getErrorMessage(projectMembersQuery.error)
  const projectTeamMembersLoading = projectTeamMembersQuery.isPending && !projectTeamMembersQuery.data
  const projectTeamMembersError = getErrorMessage(projectTeamMembersQuery.error)
  const memberUsersLoading = projectMemberUsersQuery.isPending && !projectMemberUsersQuery.data
  const memberUsersError = getErrorMessage(projectMemberUsersQuery.error)

  const { projectMemberNames, availableProjectMemberOptions } = useProjectMemberOptions({
    memberUsers: projectMemberUsersQuery.data?.items ?? [],
    projectMembers: selectedProjectMembers,
    teamMembers: projectTeamMembersQuery.data ?? [],
  })

  const noAvailableProjectMemberOptions =
    !memberUsersLoading &&
    !projectTeamMembersLoading &&
    !memberUsersError &&
    !projectTeamMembersError &&
    availableProjectMemberOptions.length === 0

  useEffect(() => {
    if (!members.showMembersModal || members.membersStep !== 'add') {
      return
    }

    if (!members.memberUserId && availableProjectMemberOptions.length > 0) {
      members.setMemberUserId(String(availableProjectMemberOptions[0].id))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    members.showMembersModal,
    members.membersStep,
    members.memberUserId,
    availableProjectMemberOptions,
    members.setMemberUserId,
  ])

  const invalidateProjectQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: appQueryKeys.projects.root })
  }

  const openMembersModal = (projectId: number) => {
    members.setSelectedProjectId(projectId)
    projectForm.setFormError('')
    members.setMembersStep('list')
    members.setShowMembersModal(true)
  }

  const goToMembersAddStep = () => {
    members.goToMembersAddStep()
    projectForm.setFormError('')
  }

  const backToMembersListStep = () => {
    members.backToMembersListStep()
    projectForm.setFormError('')
  }

  const handleAddProjectMember = async () => {
    if (members.selectedProjectId === null) {
      return
    }

    projectForm.setFormLoading(true)
    projectForm.setFormError('')

    try {
      await projectsApi.addMember(members.selectedProjectId, {
        userId: Number(members.memberUserId),
        role: members.memberRole,
      })
      members.setMembersStep('list')
      await invalidateProjectQueries()
    } catch (error) {
      projectForm.setFormError(getErrorMessage(error, 'Не удалось добавить участника'))
    } finally {
      projectForm.setFormLoading(false)
    }
  }

  const handleRemoveProjectMember = async (memberId: number) => {
    if (members.selectedProjectId === null) {
      return
    }

    if (!confirm('Убрать участника из проекта?')) {
      return
    }

    members.setPendingRemoveMemberId(memberId)
    try {
      await projectsApi.removeMember(members.selectedProjectId, memberId)
      await invalidateProjectQueries()
    } catch (error) {
      alert(getErrorMessage(error, 'Не удалось удалить участника'))
    } finally {
      members.setPendingRemoveMemberId((currentId) => (currentId === memberId ? null : currentId))
    }
  }

  return {
    showMembersModal: members.showMembersModal,
    closeMembersModal: members.closeMembersModal,
    membersStep: members.membersStep,
    goToMembersAddStep,
    backToMembersListStep,
    selectedProject,
    projectMembersQuery,
    projectTeamMembersQuery,
    projectMemberUsersQuery,
    projectMembersLoading,
    projectMembersError,
    projectTeamMembersLoading,
    projectTeamMembersError,
    memberUsersLoading,
    memberUsersError,
    selectedProjectMembers,
    projectMemberNames,
    availableProjectMemberOptions,
    noAvailableProjectMemberOptions,
    memberUserId: members.memberUserId,
    setMemberUserId: members.setMemberUserId,
    memberRole: members.memberRole,
    setMemberRole: members.setMemberRole,
    formLoading: projectForm.formLoading,
    formError: projectForm.formError,
    pendingRemoveMemberId: members.pendingRemoveMemberId,
    openMembersModal,
    handleAddProjectMember,
    handleRemoveProjectMember,
  }
}
