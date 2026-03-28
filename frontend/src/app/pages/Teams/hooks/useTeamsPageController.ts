import { useCallback, useMemo } from 'react'
import { teamsApi } from '@/app/api/teams'
import { useAuth } from '@/app/context/useAuth'
import { useTheme } from '@/app/context/useTheme'
import { TeamRole } from '@/app/types'
import { useTeamsData } from '@/app/pages/Teams/hooks/useTeamsData'
import { useTeamsMemberModalState } from '@/app/pages/Teams/hooks/useTeamsMemberModalState'
import { useTeamsPageListState } from '@/app/pages/Teams/hooks/useTeamsPageListState'
import { useTeamsTeamFormState } from '@/app/pages/Teams/hooks/useTeamsTeamFormState'
import { useTeamsThemeTokens } from '@/app/pages/Teams/hooks/useTeamsThemeTokens'

export function useTeamsPageController() {
  const { isDark } = useTheme()
  const { user: currentUser } = useAuth()
  const tokens = useTeamsThemeTokens(isDark)
  const { teams, teamMembers, allUsers, loading, error, loadData } = useTeamsData()
  const list = useTeamsPageListState()
  const teamForm = useTeamsTeamFormState()
  const memberModal = useTeamsMemberModalState()

  const getUserName = useCallback(
    (userId: number) => allUsers.find((u) => u.id === userId)?.fullName || `Пользователь #${userId}`,
    [allUsers],
  )
  const getUserRole = useCallback(
    (userId: number) => allUsers.find((u) => u.id === userId)?.profession || '',
    [allUsers],
  )
  const isTeamOwner = (teamId: number) =>
    (teamMembers[teamId] || []).some(
      (m) => m.userId === currentUser?.id && m.teamRole === TeamRole.OWNER,
    )

  const filteredTeams = useMemo(() => {
    const q = list.searchQuery.toLowerCase().trim()
    if (!q) return teams
    return teams.filter((team) => {
      if (team.name.toLowerCase().includes(q)) return true
      if ((team.description || '').toLowerCase().includes(q)) return true
      return (teamMembers[team.id] || []).some(
        (m) =>
          getUserName(m.userId).toLowerCase().includes(q) ||
          getUserRole(m.userId).toLowerCase().includes(q),
      )
    })
  }, [getUserName, getUserRole, list.searchQuery, teamMembers, teams])

  const handleCreate = async () => {
    teamForm.setFormLoading(true)
    teamForm.setFormError('')
    try {
      await teamsApi.create({ name: teamForm.formName, description: teamForm.formDesc || undefined })
      teamForm.setShowCreateModal(false)
      teamForm.setFormName('')
      teamForm.setFormDesc('')
      await loadData()
    } catch (err) {
      teamForm.setFormError(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      teamForm.setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!teamForm.editingTeam) return
    teamForm.setFormLoading(true)
    teamForm.setFormError('')
    try {
      await teamsApi.update(teamForm.editingTeam.id, {
        name: teamForm.formName,
        description: teamForm.formDesc || undefined,
      })
      teamForm.setShowEditModal(false)
      teamForm.setEditingTeam(null)
      await loadData()
    } catch (err) {
      teamForm.setFormError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      teamForm.setFormLoading(false)
    }
  }

  const handleDelete = async (teamId: number) => {
    if (!confirm('Удалить команду? Это действие нельзя отменить.')) return
    try {
      await teamsApi.delete(teamId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const handleAddMember = async (userId: number) => {
    if (!memberModal.selectedTeamId) return
    teamForm.setFormLoading(true)
    teamForm.setFormError('')
    try {
      await teamsApi.addMember(memberModal.selectedTeamId, {
        userId,
        teamRole: memberModal.memberRole,
      })
      memberModal.setShowAddMemberModal(false)
      memberModal.setSelectedTeamId(null)
      memberModal.setAddMemberSearch('')
      await loadData()
    } catch (err) {
      teamForm.setFormError(err instanceof Error ? err.message : 'Ошибка добавления')
    } finally {
      teamForm.setFormLoading(false)
    }
  }

  const candidateUsers = useMemo(() => {
    const q = memberModal.addMemberSearch.toLowerCase().trim()
    const existing = new Set(
      memberModal.selectedTeamId
        ? (teamMembers[memberModal.selectedTeamId] || []).map((m) => m.userId)
        : [],
    )
    return allUsers
      .filter((u) => !existing.has(u.id))
      .filter(
        (u) => !q || u.login.toLowerCase().includes(q) || (u.fullName || '').toLowerCase().includes(q),
      )
      .slice(0, 25)
  }, [memberModal.addMemberSearch, memberModal.selectedTeamId, allUsers, teamMembers])

  const openCreateModal = () => {
    teamForm.setFormName('')
    teamForm.setFormDesc('')
    teamForm.setFormError('')
    teamForm.setShowCreateModal(true)
  }

  return {
    isDark,
    currentUser,
    ui: tokens,
    data: {
      teams,
      teamMembers,
      allUsers,
      loading,
      error,
      loadData,
      filteredTeams,
      getUserName,
      getUserRole,
      isTeamOwner,
    },
    search: {
      query: list.searchQuery,
      setQuery: list.setSearchQuery,
    },
    menu: {
      openMenuId: list.openMenuId,
      setOpenMenuId: list.setOpenMenuId,
    },
    teamForm: {
      showCreateModal: teamForm.showCreateModal,
      setShowCreateModal: teamForm.setShowCreateModal,
      showEditModal: teamForm.showEditModal,
      setShowEditModal: teamForm.setShowEditModal,
      editingTeam: teamForm.editingTeam,
      setEditingTeam: teamForm.setEditingTeam,
      formName: teamForm.formName,
      setFormName: teamForm.setFormName,
      formDesc: teamForm.formDesc,
      setFormDesc: teamForm.setFormDesc,
      formLoading: teamForm.formLoading,
      formError: teamForm.formError,
      setFormError: teamForm.setFormError,
    },
    memberModal: {
      showAddMemberModal: memberModal.showAddMemberModal,
      setShowAddMemberModal: memberModal.setShowAddMemberModal,
      selectedTeamId: memberModal.selectedTeamId,
      setSelectedTeamId: memberModal.setSelectedTeamId,
      memberRole: memberModal.memberRole,
      setMemberRole: memberModal.setMemberRole,
      addMemberSearch: memberModal.addMemberSearch,
      setAddMemberSearch: memberModal.setAddMemberSearch,
    },
    candidateUsers,
    handlers: {
      handleCreate,
      handleEdit,
      handleDelete,
      handleAddMember,
      openCreateModal,
    },
  }
}

export type TeamsPageViewModel = ReturnType<typeof useTeamsPageController>
