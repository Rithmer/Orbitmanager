import { useMemo, useState } from 'react'

type ProjectOption = { id: number; name: string; teamId?: number | null }
type TeamOption = { id: number; name: string }

export function useReportsFilterState(projects: ProjectOption[], teamsMap: Map<number, string>) {
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined)

  const teamOptions = useMemo<TeamOption[]>(
    () =>
      [...new Set(projects.map((project) => project.teamId).filter((id): id is number => Number.isInteger(id)))]
        .map((id) => ({ id, name: teamsMap.get(id) ?? `Команда #${id}` }))
        .sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [projects, teamsMap],
  )

  const teamScopedProjects = useMemo(
    () => (selectedTeamId === undefined ? projects : projects.filter((project) => project.teamId === selectedTeamId)),
    [projects, selectedTeamId],
  )

  const hasSelectedProject = selectedProjectId !== undefined && teamScopedProjects.some((project) => project.id === selectedProjectId)
  const effectiveProjectId = hasSelectedProject ? selectedProjectId : undefined

  return {
    selectedTeamId,
    setSelectedTeamId,
    selectedProjectId,
    setSelectedProjectId,
    teamOptions,
    teamScopedProjects,
    effectiveProjectId,
  }
}
