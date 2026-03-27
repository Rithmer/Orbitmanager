import { TeamRole } from '@/app/types'
import { TEAMS_PAGE_CONSTANTS } from '@/app/pages/Teams/constants'
import type { TeamsPageViewModel } from '@/app/pages/Teams/hooks/useTeamsPageController'
import { TeamCard } from '@/app/pages/Teams/components/TeamCard'
import { TeamsGrid } from '@/app/pages/Teams/components/TeamsGrid'

type TeamsCardsSectionProps = {
  vm: TeamsPageViewModel
}

export function TeamsCardsSection({ vm }: TeamsCardsSectionProps) {
  const {
    filteredTeams,
    teamMembers,
    tokens,
    isDark,
    searchQuery,
    openMenuId,
    setOpenMenuId,
    isTeamOwner,
    currentUser,
    getUserName,
    getUserRole,
    setEditingTeam,
    setFormName,
    setFormDesc,
    setFormError,
    setShowEditModal,
    setSelectedTeamId,
    setMemberRole,
    setAddMemberSearch,
    setShowAddMemberModal,
    handleDelete,
  } = vm

  return (
    <TeamsGrid
      teams={filteredTeams}
      teamMembers={teamMembers}
      cardBg={tokens.cardBg}
      cardBorder={tokens.cardBorder}
      textSecondary={tokens.textSecondary}
      isDark={isDark}
      searchQuery={searchQuery}
      renderCard={(team, members, idx) => {
        const ci = idx % TEAMS_PAGE_CONSTANTS.AVATAR_COLORS.length
        const lightBg = isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50'
        return (
          <TeamCard
            key={team.id}
            team={team}
            members={members}
            idx={idx}
            isDark={isDark}
            cardBg={tokens.cardBg}
            cardBorder={tokens.cardBorder}
            textPrimary={tokens.textPrimary}
            textSecondary={tokens.textSecondary}
            dividerColor={tokens.dividerColor}
            avatarBg={tokens.avatarBg}
            color={TEAMS_PAGE_CONSTANTS.AVATAR_COLORS[ci]}
            textColor={TEAMS_PAGE_CONSTANTS.AVATAR_TEXT_COLORS[ci]}
            lightBg={lightBg}
            openMenuId={openMenuId}
            canManage={isTeamOwner(team.id)}
            currentUserId={currentUser?.id}
            getUserName={getUserName}
            getUserRole={getUserRole}
            onToggleMenu={(id) => setOpenMenuId(openMenuId === id ? null : id)}
            onEdit={(pick) => {
              setEditingTeam(pick)
              setFormName(pick.name)
              setFormDesc(pick.description || '')
              setFormError('')
              setShowEditModal(true)
              setOpenMenuId(null)
            }}
            onAddMember={(teamId) => {
              setSelectedTeamId(teamId)
              setMemberRole(TeamRole.MEMBER)
              setAddMemberSearch('')
              setShowAddMemberModal(true)
              setOpenMenuId(null)
            }}
            onDelete={(id) => {
              void handleDelete(id)
              setOpenMenuId(null)
            }}
          />
        )
      }}
    />
  )
}
