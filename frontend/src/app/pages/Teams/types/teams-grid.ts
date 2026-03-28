import type { ReactNode } from 'react'
import type { Team, TeamMember } from '@/app/types'

export type TeamsGridProps = {
  teams: Team[]
  teamMembers: Record<number, TeamMember[]>
  cardBg: string
  cardBorder: string
  textSecondary: string
  isDark: boolean
  renderCard: (team: Team, members: TeamMember[], idx: number) => ReactNode
  searchQuery: string
}
