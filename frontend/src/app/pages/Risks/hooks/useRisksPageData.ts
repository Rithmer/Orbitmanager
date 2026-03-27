import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { teamsApi } from '@/app/api/teams'
import { useAuth } from '@/app/context/useAuth'
import { useNavMembershipBatch } from '@/app/hooks/useNavMembershipBatch'
import { useRisksSectionAccess } from '@/app/hooks/useRisksSectionAccess'
import { AccountRole } from '@/app/types'
import { appQueryKeys } from '@/app/query'
import {
  resolveRoleScopedProjects,
  resolveRoleScopedTeams,
  useRisksProjectsQuery,
  useRisksSummaryQuery,
} from '@/app/features/risks'
import { formatPercentFromFitScore, isMlUnavailableError } from '@/app/pages/Risks/helpers'
import { RISKS_PAGE_CONSTANTS } from '@/app/pages/Risks/constants'

type Params = {
  selectedTeamId: number | undefined
  selectedProjectId: number | undefined
  selectedTaskId: number | undefined
}

export function useRisksPageData({ selectedTeamId, selectedProjectId, selectedTaskId }: Params) {
  const { user, isAdmin } = useAuth()
  const uid = user?.id
  const role = user?.accountRole
  const { allowed: canUseRisks, isLoading: risksAccessLoading } = useRisksSectionAccess()
  const { teamsBatchQuery, projectsBatchQuery } = useNavMembershipBatch()
  const risksApiEnabled = isAdmin || (!risksAccessLoading && canUseRisks)

  const projectsQuery = useRisksProjectsQuery({ enabled: risksApiEnabled })
  const teamsQuery = useQuery({
    queryKey: appQueryKeys.teams.risksOptions,
    queryFn: ({ signal }) => teamsApi.list({ page: 1, limit: 1000, sort: 'name' }, { signal }),
    staleTime: 60_000,
    enabled: risksApiEnabled,
  })

  const rawProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data])
  const rawTeams = useMemo(() => teamsQuery.data?.items ?? [], [teamsQuery.data?.items])
  const teamMembersByTeam = useMemo(() => teamsBatchQuery.data ?? {}, [teamsBatchQuery.data])
  const projectMembersByProject = useMemo(() => projectsBatchQuery.data ?? {}, [projectsBatchQuery.data])

  const roleScopedTeams = useMemo(
    () =>
      uid
        ? resolveRoleScopedTeams(role ?? AccountRole.MEMBER, uid, rawTeams, teamMembersByTeam)
        : [],
    [rawTeams, role, teamMembersByTeam, uid],
  )

  const roleScopedProjects = useMemo(
    () =>
      uid
        ? resolveRoleScopedProjects(
            role ?? AccountRole.MEMBER,
            uid,
            rawProjects,
            selectedTeamId,
            teamMembersByTeam,
            projectMembersByProject,
          )
        : [],
    [projectMembersByProject, rawProjects, role, selectedTeamId, teamMembersByTeam, uid],
  )

  const sortedTeams = useMemo(() => [...roleScopedTeams].sort((a, b) => a.name.localeCompare(b.name, 'ru')), [roleScopedTeams])
  const sortedProjects = useMemo(
    () => [...roleScopedProjects].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    [roleScopedProjects],
  )

  const effectiveProjectId = useMemo(() => {
    if (sortedProjects.length === 0) return undefined
    const hasSelected = selectedProjectId !== undefined && sortedProjects.some((project) => project.id === selectedProjectId)
    if (hasSelected) return selectedProjectId
    return sortedProjects[0].id
  }, [selectedProjectId, sortedProjects])

  const activeProjectIds = useMemo(() => (effectiveProjectId ? [effectiveProjectId] : []), [effectiveProjectId])
  const projectNamesById = useMemo(
    () =>
      roleScopedProjects.reduce<Record<number, string>>((acc, project) => {
        acc[project.id] = project.name
        return acc
      }, {}),
    [roleScopedProjects],
  )

  const risksSummaryQuery = useRisksSummaryQuery(activeProjectIds, projectNamesById, {
    enabled: risksApiEnabled && activeProjectIds.length > 0,
  })

  const cards = risksSummaryQuery.data
  const selectedCard = effectiveProjectId ? cards.find((card) => card.projectId === effectiveProjectId) : undefined
  const sortedTaskInsights = useMemo(
    () => [...(selectedCard?.taskInsights ?? [])].sort((a, b) => a.taskSuccessProbability - b.taskSuccessProbability),
    [selectedCard?.taskInsights],
  )
  const selectedTask = selectedTaskId ? sortedTaskInsights.find((task) => task.taskId === selectedTaskId) : sortedTaskInsights[0]
  const topRecommendedAssignees = useMemo(
    () =>
      (selectedTask?.recommendedAssignees ?? [])
        .slice()
        .sort((a, b) => formatPercentFromFitScore(b.fitScore) - formatPercentFromFitScore(a.fitScore))
        .slice(0, 5),
    [selectedTask?.recommendedAssignees],
  )

  const waitingForAccess = !isAdmin && risksAccessLoading
  const isInitialLoading = risksApiEnabled && (projectsQuery.isPending || teamsQuery.isPending || risksSummaryQuery.isPending)
  const isRefreshing = risksApiEnabled && risksSummaryQuery.isFetching && cards.length > 0
  const isMlDown = isMlUnavailableError(risksSummaryQuery.error)
  const errorMessage = isMlDown
    ? RISKS_PAGE_CONSTANTS.mlDownMessage
    : risksSummaryQuery.error instanceof Error
      ? risksSummaryQuery.error.message
      : RISKS_PAGE_CONSTANTS.defaultErrorMessage

  return {
    isAdmin,
    canUseRisks,
    risksAccessLoading,
    waitingForAccess,
    projectsQuery,
    teamsQuery,
    risksSummaryQuery,
    sortedTeams,
    sortedProjects,
    effectiveProjectId,
    selectedCard,
    sortedTaskInsights,
    selectedTask,
    topRecommendedAssignees,
    cards,
    isInitialLoading,
    isRefreshing,
    isMlDown,
    errorMessage,
  }
}
