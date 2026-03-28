import type { Team, TeamMember } from '@/app/types'

export type TeamCardProps = {
  team: Team
  members: TeamMember[]
  idx: number
  isDark: boolean
  cardBg: string
  cardBorder: string
  textPrimary: string
  textSecondary: string
  dividerColor: string
  avatarBg: string
  color: string
  textColor: string
  lightBg: string
  openMenuId: number | null
  canManage: boolean
  currentUserId: number | undefined
  getUserName: (id: number) => string
  getUserRole: (id: number) => string
  onToggleMenu: (id: number) => void
  onEdit: (team: Team) => void
  onAddMember: (teamId: number) => void
  onDelete: (teamId: number) => void
}
