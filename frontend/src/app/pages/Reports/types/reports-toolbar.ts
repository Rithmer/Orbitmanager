export type ReportsToolbarTeamOption = { id: number; name: string }
export type ReportsToolbarProjectOption = { id: number; name: string }

export type ReportsToolbarProps = {
  isDark: boolean
  textSecondary: string
  selectedTeamId: number | undefined
  selectedProjectId: number | undefined
  teamOptions: ReportsToolbarTeamOption[]
  projectOptions: ReportsToolbarProjectOption[]
  filtersPending: boolean
  isRefreshing: boolean
  onChangeTeam: (teamId: number | undefined) => void
  onChangeProject: (projectId: number | undefined) => void
  onRefresh: () => void
}
