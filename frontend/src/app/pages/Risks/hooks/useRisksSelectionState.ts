import { useState } from 'react'

export function useRisksSelectionState() {
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined)
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(undefined)
  const [expandedAlternativesByTaskId, setExpandedAlternativesByTaskId] = useState<Record<number, boolean>>({})

  const selectTeam = (teamId: number) => {
    setSelectedTeamId(teamId)
    setSelectedProjectId(undefined)
    setSelectedTaskId(undefined)
  }

  const goBackToTeams = () => {
    setSelectedTeamId(undefined)
    setSelectedProjectId(undefined)
    setSelectedTaskId(undefined)
  }

  const selectProject = (projectId: number) => {
    setSelectedProjectId(projectId)
    setSelectedTaskId(undefined)
  }

  return {
    selectedTeamId,
    selectedProjectId,
    selectedTaskId,
    expandedAlternativesByTaskId,
    setSelectedTaskId,
    setExpandedAlternativesByTaskId,
    selectTeam,
    goBackToTeams,
    selectProject,
  }
}
