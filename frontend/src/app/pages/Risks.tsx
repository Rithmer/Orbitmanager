import { useMemo, useState } from 'react'
import { AlertCircle, RefreshCw, ShieldAlert, Users } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { ApiErrorBanner } from '../components/ApiErrorBanner'
import {
  PageRefreshOverlay,
  PageSection,
  PageShell,
  PageToolbarSkeleton,
  RefreshBadge,
} from '../components/PageShell'
import { useRisksSectionAccess } from '../hooks/useRisksSectionAccess'
import { useNavMembershipBatch } from '../hooks/useNavMembershipBatch'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'
import {
  resolveRoleScopedProjects,
  resolveRoleScopedTeams,
  useRisksProjectsQuery,
  useRisksSummaryQuery,
} from '../features/risks'
import { teamsApi } from '../api/teams'
import { AccountRole, RISK_LEVEL_LABELS, type RiskLevel } from '../types'
import { ApiError } from '../api/client'

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  low: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300',
  medium: 'bg-amber-500/10 text-amber-600 dark:text-amber-300',
  high: 'bg-red-500/10 text-red-600 dark:text-red-300',
}

function formatFitScore(score: number): string {
  const normalized = Math.max(0, Math.min(1, (score + 1) / 2))
  return `${Math.round(normalized * 100)}%`
}

function formatImpactLabel(value: number): { label: string; className: string } {
  if (value >= 0.35) {
    return { label: 'Сильно повышает шанс выполнения', className: 'text-emerald-500' }
  }
  if (value >= 0.1) {
    return { label: 'Повышает шанс выполнения', className: 'text-emerald-400' }
  }
  if (value > -0.1) {
    return { label: 'Нейтральное влияние', className: 'text-slate-400' }
  }
  if (value > -0.35) {
    return { label: 'Снижает шанс выполнения', className: 'text-amber-500' }
  }
  return { label: 'Сильно снижает шанс выполнения', className: 'text-red-500' }
}

function isMlUnavailableError(error: unknown): boolean {
  if (error instanceof ApiError && error.status === 503) return true
  return false
}

export function Risks() {
  const { isDark } = useTheme()
  const { user, isAdmin } = useAuth()
  const uid = user?.id
  const role = user?.accountRole

  const { allowed: canUseRisks, isLoading: risksAccessLoading } = useRisksSectionAccess()
  const { teamsBatchQuery, projectsBatchQuery } = useNavMembershipBatch()
  const risksApiEnabled = isAdmin || (!risksAccessLoading && canUseRisks)

  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>(undefined)
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(undefined)
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(undefined)

  const projectsQuery = useRisksProjectsQuery({ enabled: risksApiEnabled })
  const teamsQuery = useQuery({
    queryKey: ['risks', 'team-options'] as const,
    queryFn: ({ signal }) => teamsApi.list({ page: 1, limit: 1000, sort: 'name' }, { signal }),
    staleTime: 60_000,
    enabled: risksApiEnabled,
  })

  const rawProjects = useMemo(() => projectsQuery.data ?? [], [projectsQuery.data])
  const rawTeams = useMemo(() => teamsQuery.data?.items ?? [], [teamsQuery.data?.items])
  const teamMembersByTeam = teamsBatchQuery.data ?? {}
  const projectMembersByProject = projectsBatchQuery.data ?? {}

  const roleScopedTeams = useMemo(
    () =>
      uid
        ? resolveRoleScopedTeams(
            role ?? AccountRole.MEMBER,
            uid,
            rawTeams,
            teamMembersByTeam,
          )
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
    [
      projectMembersByProject,
      rawProjects,
      role,
      selectedTeamId,
      teamMembersByTeam,
      uid,
    ],
  )

  const activeProjectIds = useMemo(() => {
    if (selectedProjectId) return [selectedProjectId]
    return roleScopedProjects.map((project) => project.id)
  }, [roleScopedProjects, selectedProjectId])

  const projectNamesById = useMemo(
    () =>
      roleScopedProjects.reduce<Record<number, string>>((acc, project) => {
        acc[project.id] = project.name
        return acc
      }, {}),
    [roleScopedProjects],
  )

  const risksSummaryQuery = useRisksSummaryQuery(activeProjectIds, projectNamesById, {
    enabled: risksApiEnabled && roleScopedProjects.length > 0,
  })

  const cards = risksSummaryQuery.data
  const selectedCard = selectedProjectId
    ? cards.find((card) => card.projectId === selectedProjectId)
    : cards[0]
  const selectedTask = selectedTaskId
    ? selectedCard?.taskInsights.find((task) => task.taskId === selectedTaskId)
    : selectedCard?.taskInsights[0]

  const waitingForAccess = !isAdmin && risksAccessLoading
  const isInitialLoading =
    risksApiEnabled && (projectsQuery.isPending || teamsQuery.isPending || risksSummaryQuery.isPending)
  const isRefreshing = risksApiEnabled && risksSummaryQuery.isFetching && cards.length > 0
  const showInitialSkeleton = useSmoothPageSkeleton(waitingForAccess || isInitialLoading)

  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const panelMuted = isDark ? 'bg-[#1f2a3b]' : 'bg-[#f8fafc]'
  const selectClassName = `px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`

  const isMlDown = isMlUnavailableError(risksSummaryQuery.error)
  const errorMessage = isMlDown
    ? 'ML-сервис оценки рисков недоступен. Попробуйте обновить позже.'
    : risksSummaryQuery.error instanceof Error
      ? risksSummaryQuery.error.message
      : 'Не удалось загрузить риски. Попробуйте обновить страницу.'

  if (showInitialSkeleton) {
    return (
      <PageShell title="Риски" description="Подготавливаем прогнозы по проектам и задачам.">
        <div className="space-y-6">
          <PageToolbarSkeleton />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <div className="h-56 rounded-2xl skeleton-shimmer bg-black/10 dark:bg-white/10" />
            <div className="h-56 rounded-2xl skeleton-shimmer bg-black/10 dark:bg-white/10" />
            <div className="h-56 rounded-2xl skeleton-shimmer bg-black/10 dark:bg-white/10" />
          </div>
        </div>
      </PageShell>
    )
  }

  if (!isAdmin && !risksAccessLoading && !canUseRisks) {
    return (
      <PageShell
        title="Риски"
        description="Раздел доступен администраторам, владельцам команд и тимлидам."
      >
        <PageSection title="Нет доступа">
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
            <p className={`text-sm ${textSecondary} max-w-md`}>
              Для вашей роли раздел недоступен. Обратитесь к владельцу команды или администратору.
            </p>
          </div>
        </PageSection>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Риски"
      description="Оценка вероятности успеха проекта, рисков задач и рекомендаций по составу исполнителей."
      actions={
        <div className="flex items-center gap-3 flex-wrap">
          {role === AccountRole.ADMIN || role === AccountRole.MEMBER ? (
            roleScopedTeams.length > 0 ? (
              <select
                value={selectedTeamId !== undefined ? String(selectedTeamId) : ''}
                onChange={(event) => {
                  const next = event.target.value ? Number(event.target.value) : undefined
                  setSelectedTeamId(next)
                  setSelectedProjectId(undefined)
                  setSelectedTaskId(undefined)
                }}
                className={selectClassName}
              >
                <option value="">Все доступные команды</option>
                {roleScopedTeams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            ) : null
          ) : null}

          {roleScopedProjects.length > 0 ? (
            <select
              value={selectedProjectId !== undefined ? String(selectedProjectId) : ''}
              onChange={(event) => {
                const next = event.target.value ? Number(event.target.value) : undefined
                setSelectedProjectId(next)
                setSelectedTaskId(undefined)
              }}
              className={selectClassName}
            >
              <option value="">Все доступные проекты</option>
              {roleScopedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          ) : null}

          {isRefreshing ? <RefreshBadge isRefreshing label="Обновляем риски" /> : null}
          <button
            onClick={() => void risksSummaryQuery.refetch()}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
        </div>
      }
    >
      <ApiErrorBanner />

      {risksSummaryQuery.error && cards.length === 0 ? (
        <PageSection title={isMlDown ? 'ML-сервис недоступен' : 'Ошибка загрузки'}>
          <div className="flex flex-col items-center justify-center gap-4 py-14 text-center">
            <AlertCircle className={`w-10 h-10 ${isMlDown ? 'text-amber-500' : 'text-red-500'}`} />
            <p className={`text-sm ${textSecondary} max-w-md`}>{errorMessage}</p>
            <button
              onClick={() => void risksSummaryQuery.refetch()}
              className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Повторить
            </button>
          </div>
        </PageSection>
      ) : (
        <PageRefreshOverlay show={isRefreshing} label="Обновляем данные рисков">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
            <PageSection
              title="Успех проекта"
              description="Вероятность успешного завершения выбранного проекта."
              className={`${cardBg} border ${cardBorder}`}
            >
              {selectedCard ? (
                <div className="space-y-4">
                  <div className="text-4xl font-bold text-[#4880ff]">{selectedCard.successProbability}%</div>
                  <div
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${RISK_BADGE_STYLES[selectedCard.riskLevel]}`}
                  >
                    Риск: {RISK_LEVEL_LABELS[selectedCard.riskLevel]}
                  </div>
                  <div className={`rounded-xl ${panelMuted} p-3 space-y-2`}>
                    <p className={`text-xs uppercase tracking-wide ${textSecondary}`}>Факторы</p>
                    {selectedCard.riskFactors.length > 0 ? (
                      <ul className="space-y-1">
                        {selectedCard.riskFactors.map((factor) => (
                          <li key={factor.id} className="text-sm">
                            - {factor.label}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className={`text-sm ${textSecondary}`}>Критичных факторов пока не найдено.</p>
                    )}
                  </div>
                </div>
              ) : (
                <p className={`text-sm ${textSecondary}`}>Нет данных по проектам.</p>
              )}
            </PageSection>

            <PageSection
              title="Подбор исполнителей"
              description="Выберите задачу и получите список наиболее подходящих исполнителей."
              className={`${cardBg} border ${cardBorder}`}
            >
              {selectedCard?.taskInsights.length ? (
                <div className="space-y-4">
                  <select
                    value={selectedTask?.taskId ?? ''}
                    onChange={(event) => {
                      const next = event.target.value ? Number(event.target.value) : undefined
                      setSelectedTaskId(next)
                    }}
                    className={selectClassName}
                  >
                    {selectedCard.taskInsights.map((task) => (
                      <option key={task.taskId} value={task.taskId}>
                        {task.taskName}
                      </option>
                    ))}
                  </select>

                  {selectedTask ? (
                    <div className={`rounded-xl ${panelMuted} p-3 space-y-3`}>
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold">Шанс выполнения: {selectedTask.taskSuccessProbability}%</p>
                        <p className={`text-xs ${textSecondary}`}>
                          Риск из-за координации команды: {selectedTask.coordinationPenalty}%
                        </p>
                      </div>
                      {selectedTask.recommendedAssignees.length > 0 ? (
                        <div className="space-y-2">
                          {selectedTask.recommendedAssignees.map((assignee, index) => (
                            <div
                              key={`${selectedTask.taskId}-${assignee.userId}`}
                              className={`rounded-lg border ${cardBorder} px-3 py-2`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold truncate">
                                  {index + 1}. {assignee.fullName}
                                </span>
                                <span className="text-xs text-[#4880ff] font-semibold">
                                  Рекомендация: {formatFitScore(assignee.fitScore)}
                                </span>
                              </div>
                              <p className={`text-xs mt-1 ${textSecondary}`}>
                                {assignee.role} - {assignee.profession}
                              </p>
                              <p className={`text-xs mt-1 ${textSecondary}`}>{assignee.reason}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={`text-sm ${textSecondary}`}>Нет доступных исполнителей для рекомендации.</p>
                      )}
                    </div>
                  ) : null}
                  {selectedTask && selectedTask.assigneeBreakdown.length > 0 ? (
                    <div className={`rounded-xl ${panelMuted} p-3`}>
                      <p className={`text-xs uppercase tracking-wide ${textSecondary}`}>Текущий вклад назначенных</p>
                      <div className="mt-2 space-y-2">
                        {selectedTask.assigneeBreakdown.map((assignee) => (
                          <div key={`${selectedTask.taskId}-${assignee.userId}`} className="flex items-center justify-between text-sm">
                            <span className="truncate pr-3">{assignee.userName}</span>
                            <span className={formatImpactLabel(assignee.impactScore).className}>
                              {formatImpactLabel(assignee.impactScore).label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className={`text-sm ${textSecondary}`}>Нет задач для выбора в текущем срезе.</p>
              )}
            </PageSection>

            <PageSection
              title="Рекомендации ИИ"
              description="Кого добавить или как перераспределить участников задачи."
              className={`${cardBg} border ${cardBorder}`}
            >
              {selectedCard?.recommendations.length ? (
                <div className="space-y-3">
                  {selectedCard.recommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      className={`rounded-xl ${panelMuted} p-3 border ${cardBorder}`}
                    >
                      <div className="flex items-start gap-2">
                        {recommendation.type === 'swap_members' || recommendation.type === 'rebalance_load' ? (
                          <Users className="h-4 w-4 text-amber-500 mt-0.5" />
                        ) : (
                          <ShieldAlert className="h-4 w-4 text-[#4880ff] mt-0.5" />
                        )}
                        <div>
                          <p className="text-sm font-semibold">{recommendation.title}</p>
                          <p className={`text-xs mt-1 ${textSecondary}`}>{recommendation.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-sm ${textSecondary}`}>Рекомендации появятся после обновления risk-модели.</p>
              )}
            </PageSection>
          </div>
        </PageRefreshOverlay>
      )}
    </PageShell>
  )
}
