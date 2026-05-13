import { TeamRole } from '@/app/types'
import { TEAMS_PAGE_CONSTANTS } from '@/app/pages/Teams/constants'
import { TeamCard } from './TeamCard'
import { TeamsGrid } from './TeamsGrid'
import type { TeamsCardsSectionProps } from '@/app/pages/Teams/types'

export function TeamsCardsSection({ model }: TeamsCardsSectionProps) {
  const { ui, data, search, menu, teamForm, memberModal, handlers, isDark, currentUser } = model
  const {
    filteredTeams,
    teamMembers,
    getUserName,
    getUserRole,
    isTeamOwner,
  } = data
  const { query: searchQuery } = search
  const { openMenuId, setOpenMenuId } = menu
  const {
    setEditingTeam,
    setFormName,
    setFormDesc,
    setFormError,
    setShowEditModal,
  } = teamForm
  const { setSelectedTeamId, setMemberRole, setAddMemberSearch, setShowAddMemberModal } = memberModal
  const { handleDelete } = handlers

  return (
    <TeamsGrid
      teams={filteredTeams}
      teamMembers={teamMembers}
      cardBg={ui.cardBg}
      cardBorder={ui.cardBorder}
      textSecondary={ui.textSecondary}
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
            cardBg={ui.cardBg}
            cardBorder={ui.cardBorder}
            textPrimary={ui.textPrimary}
            textSecondary={ui.textSecondary}
            dividerColor={ui.dividerColor}
            avatarBg={ui.avatarBg}
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
