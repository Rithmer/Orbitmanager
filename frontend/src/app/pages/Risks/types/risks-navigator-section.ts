export type RisksNavigatorSectionProps = {
  selectedTeamId: number | undefined
  sortedTeams: Array<{ id: number; name: string }>
  sortedProjects: Array<{ id: number; name: string }>
  effectiveProjectId: number | undefined
  cardBg: string
  cardBorder: string
  textSecondary: string
  divider: string
  isDark: boolean
  onSelectTeam: (teamId: number) => void
  onSelectProject: (projectId: number) => void
  onBackToTeams: () => void
}
