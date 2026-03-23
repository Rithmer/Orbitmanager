import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Plus,
  MoreVertical,
  Users,
  BarChart2,
  Calendar as CalendarIcon,
  Trash2,
  Edit3,
  UserPlus,
  Search,
  AlertTriangle,
  LoaderCircle,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { Navigate, useNavigate, useSearchParams } from 'react-router'
import { useTheme } from '../context/useTheme'
import { projectsApi } from '../api/projects'
import { ErrorMessage, Modal, InputField, SelectField, SubmitButton } from '../components/Modal'
import {
  PageCardGridSkeleton,
  PageRefreshOverlay,
  PageShell,
  PageToolbarSkeleton,
  RefreshBadge,
} from '../components/PageShell'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'
import { useProjectsSectionAccess } from '../hooks/useProjectsSectionAccess'
import { ProjectRole, PROJECT_ROLE_LABELS, ProjectStatus, PROJECT_STATUS_LABELS, RiskLevel } from '../types'
import {
  useProjectMemberUsersQuery,
  useProjectMembersQuery,
  useProjectTeamMembersQuery,
  useProjectTeamOptionsQuery,
  useProjectsListViewQuery,
} from '../features/projects'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

const CARD_COLORS = [
  'bg-[#4880ff]',
  'bg-[#10b981]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#ef4444]',
]

function readPositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

function buildPageQueryParams(
  currentParams: URLSearchParams,
  nextPage: number,
  nextSearch: string,
) {
  const nextParams = new URLSearchParams(currentParams)

  if (nextPage > 1) {
    nextParams.set('page', String(nextPage))
  } else {
    nextParams.delete('page')
  }

  if (nextSearch) {
    nextParams.set('search', nextSearch)
  } else {
    nextParams.delete('search')
  }

  return nextParams
}

function PaginationButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg border border-[#e8e8e8] px-3 py-2 text-sm font-semibold text-[#202224] transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#313d4f] dark:text-[#f4f3f2] dark:hover:bg-[#1c2534]"
    >
      {children}
    </button>
  )
}

export function Projects() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = readPositiveInt(searchParams.get('page'), 1)
  const searchTerm = searchParams.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(searchTerm)

  const [filterTeamId, setFilterTeamId] = useState<number | null>(null)
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTeamId, setFormTeamId] = useState('')
  const [formStatus, setFormStatus] = useState(ProjectStatus.ACTIVE)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState(ProjectRole.DEVELOPER)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<number | null>(null)
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<number | null>(null)

  useEffect(() => {
    if (openMenuId === null) return

    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) return

      const clickedMenu = target.closest(
        `[data-project-menu-id="${openMenuId}"]`,
      )
      const clickedButton = target.closest(
        `[data-project-menu-button-id="${openMenuId}"]`,
      )

      if (!clickedMenu && !clickedButton) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [openMenuId])

  const projectsQuery = useProjectsListViewQuery({
    page,
    limit: PAGE_SIZE,
    search: searchTerm || undefined,
    teamId: filterTeamId ?? undefined,
    status: filterStatus,
  })
  const projects = projectsQuery.data?.items ?? []
  const selectedProject = projects.find((project) => project.id === selectedProjectId) ?? null
  const projectMembersQuery = useProjectMembersQuery(selectedProjectId, showMembersModal)
  const projectTeamMembersQuery = useProjectTeamMembersQuery(
    selectedProject?.teamId ?? null,
    showAddMemberModal,
  )
  const projectMemberUsersQuery = useProjectMemberUsersQuery(
    showMembersModal || showAddMemberModal,
  )
  const teamsOptionsQuery = useProjectTeamOptionsQuery(true)

  const isInitialLoading = projectsQuery.isPending && !projectsQuery.data
  const isRefreshing = projectsQuery.isFetching && !!projectsQuery.data
  const listError = projectsQuery.error instanceof Error ? projectsQuery.error.message : ''
  const totalProjects = projectsQuery.data?.total ?? 0
  const totalPages = projectsQuery.data?.totalPages ?? 1
  const selectedProjectMembers = useMemo(() => projectMembersQuery.data ?? [], [projectMembersQuery.data])
  const projectMembersLoading = projectMembersQuery.isPending && !projectMembersQuery.data
  const projectMembersError = projectMembersQuery.error instanceof Error ? projectMembersQuery.error.message : ''
  const projectTeamMembersLoading = projectTeamMembersQuery.isPending && !projectTeamMembersQuery.data
  const projectTeamMembersError = projectTeamMembersQuery.error instanceof Error ? projectTeamMembersQuery.error.message : ''
  const memberUsersLoading = projectMemberUsersQuery.isPending && !projectMemberUsersQuery.data
  const memberUsersError = projectMemberUsersQuery.error instanceof Error ? projectMemberUsersQuery.error.message : ''
  const projectMemberNames = useMemo(() => {
    const names = new Map<number, string>()

    for (const user of projectMemberUsersQuery.data?.items ?? []) {
      names.set(user.id, user.fullName)
    }

    return names
  }, [projectMemberUsersQuery.data])

  const availableProjectMemberOptions = useMemo(() => {
    const teamMemberIds = new Set((projectTeamMembersQuery.data ?? []).map((member) => member.userId))
    const projectMemberIds = new Set(selectedProjectMembers.map((member) => member.userId))
    return (projectMemberUsersQuery.data?.items ?? []).filter(
      (user) => teamMemberIds.has(user.id) && !projectMemberIds.has(user.id),
    )
  }, [projectMemberUsersQuery.data, projectTeamMembersQuery.data, selectedProjectMembers])
  const noAvailableProjectMemberOptions =
    !memberUsersLoading &&
    !projectTeamMembersLoading &&
    !memberUsersError &&
    !projectTeamMembersError &&
    availableProjectMemberOptions.length === 0

  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const inputBg = isDark
    ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]'
    : 'bg-white border-[#e8e8e8] text-[#202224]'
  const moreIconColor = isDark
    ? 'text-[#94a3b8] hover:text-[#f4f3f2]'
    : 'text-gray-400 hover:text-gray-600'

  useEffect(() => {
    setSearchInput(searchTerm)
  }, [searchTerm])

  useEffect(() => {
    const normalizedSearch = searchInput.trim()
    const timeoutId = setTimeout(() => {
      if (normalizedSearch === searchTerm) {
        return
      }

      const nextParams = buildPageQueryParams(searchParams, 1, normalizedSearch)
      setSearchParams(nextParams, { replace: true })
    }, SEARCH_DEBOUNCE_MS)

    return () => clearTimeout(timeoutId)
  }, [searchInput, searchParams, searchTerm, setSearchParams])

  useEffect(() => {
    if (totalPages > 0 && page > totalPages) {
      const nextParams = buildPageQueryParams(searchParams, totalPages, searchTerm)
      setSearchParams(nextParams, { replace: true })
    }
  }, [page, searchParams, searchTerm, setSearchParams, totalPages])

  useEffect(() => {
    setOpenMenuId(null)
  }, [page, searchTerm, filterTeamId, filterStatus])

  useEffect(() => {
    if (!showCreateModal) {
      return
    }

    if (!formTeamId && teamsOptionsQuery.data?.items.length) {
      setFormTeamId(String(teamsOptionsQuery.data.items[0].id))
    }
  }, [formTeamId, showCreateModal, teamsOptionsQuery.data])

  useEffect(() => {
    if (!showAddMemberModal) {
      return
    }

    if (!memberUserId && availableProjectMemberOptions.length > 0) {
      setMemberUserId(String(availableProjectMemberOptions[0].id))
    }
  }, [availableProjectMemberOptions, memberUserId, showAddMemberModal])

  const updatePage = (nextPage: number) => {
    const nextParams = buildPageQueryParams(searchParams, nextPage, searchTerm)
    setSearchParams(nextParams)
  }

  const openCreateModal = () => {
    setFormName('')
    setFormDescription('')
    setFormTeamId('')
    setFormStatus(ProjectStatus.ACTIVE)
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (projectId: number) => {
    const project = projects.find((item) => item.id === projectId)
    if (!project) {
      return
    }

    setEditingProjectId(projectId)
    setFormName(project.name)
    setFormDescription(project.description || '')
    setFormStatus(project.status)
    setFormError('')
    setShowEditModal(true)
  }

  const openMembersModal = (projectId: number) => {
    setSelectedProjectId(projectId)
    setFormError('')
    setShowMembersModal(true)
  }

  const openAddMemberModal = () => {
    setMemberUserId('')
    setMemberRole(ProjectRole.DEVELOPER)
    setFormError('')
    setShowAddMemberModal(true)
  }

  const invalidateProjectQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const handleCreateProject = async () => {
    setFormLoading(true)
    setFormError('')

    try {
      await projectsApi.create({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        teamId: Number(formTeamId),
        status: formStatus,
      })
      setShowCreateModal(false)
      await invalidateProjectQueries()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось создать проект')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditProject = async () => {
    if (editingProjectId === null) {
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      await projectsApi.update(editingProjectId, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
        status: formStatus,
      })
      setShowEditModal(false)
      setEditingProjectId(null)
      await invalidateProjectQueries()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось обновить проект')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: number) => {
    if (!confirm('Удалить проект?')) {
      return
    }

    setPendingDeleteProjectId(projectId)
    try {
      await projectsApi.delete(projectId)
      setOpenMenuId(null)
      await invalidateProjectQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось удалить проект')
    } finally {
      setPendingDeleteProjectId((currentId) => (currentId === projectId ? null : currentId))
    }
  }

  const handleAddProjectMember = async () => {
    if (selectedProjectId === null) {
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      await projectsApi.addMember(selectedProjectId, {
        userId: Number(memberUserId),
        role: memberRole,
      })
      setShowAddMemberModal(false)
      await invalidateProjectQueries()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось добавить участника')
    } finally {
      setFormLoading(false)
    }
  }

  const handleRemoveProjectMember = async (memberId: number) => {
    if (selectedProjectId === null) {
      return
    }

    if (!confirm('Убрать участника из проекта?')) {
      return
    }

    setPendingRemoveMemberId(memberId)
    try {
      await projectsApi.removeMember(selectedProjectId, memberId)
      await invalidateProjectQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось удалить участника')
    } finally {
      setPendingRemoveMemberId((currentId) => (currentId === memberId ? null : currentId))
    }
  }

  const statusClassMap: Record<ProjectStatus, { bg: string; text: string }> = {
    [ProjectStatus.ACTIVE]: {
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      text: 'text-emerald-500',
    },
    [ProjectStatus.ON_HOLD]: {
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      text: 'text-amber-500',
    },
    [ProjectStatus.COMPLETED]: {
      bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      text: 'text-[#4880ff]',
    },
    [ProjectStatus.ARCHIVED]: {
      bg: isDark ? 'bg-[#94a3b8]/10' : 'bg-gray-50',
      text: 'text-[#94a3b8]',
    },
  }

  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoading)
  const projectsSectionAccess = useProjectsSectionAccess()

  if (!projectsSectionAccess.isLoading && !projectsSectionAccess.allowed) {
    return <Navigate to="/" replace />
  }

  return (
    <PageShell
      title="Проекты"
      description="Серверная пагинация, компактная карточка проекта и ленивые модальные списки."
      actions={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3a6fe0] btn-fizzy"
        >
          <Plus className="h-4 w-4" />
          Новый проект
        </button>
      }
    >
      {showInitialSkeleton ? (
        <>
          <PageToolbarSkeleton />
          <PageCardGridSkeleton variant="project" count={6} />
        </>
      ) : listError && !projectsQuery.data ? (
        <>
          <div className="mb-6">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Поиск проектов..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={`w-full rounded-xl border px-9 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
              />
            </div>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <select
                  value={filterTeamId ?? ''}
                  onChange={(e) => {
                    const next = e.target.value ? Number(e.target.value) : null
                    setFilterTeamId(next)
                    const nextParams = buildPageQueryParams(searchParams, 1, searchTerm)
                    setSearchParams(nextParams, { replace: true })
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
                >
                  <option value="">Все команды</option>
                  {(teamsOptionsQuery.data?.items ?? []).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => {
                    const next = (e.target.value || '') as ProjectStatus | ''
                    setFilterStatus(next)
                    const nextParams = buildPageQueryParams(searchParams, 1, searchTerm)
                    setSearchParams(nextParams, { replace: true })
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
                >
                  <option value="">Все статусы</option>
                  {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
              <span>0 проектов</span>
            </div>
          </div>
          <ErrorMessage message={listError} />
        </>
      ) : (
        <PageRefreshOverlay show={isRefreshing} label="Обновление проектов">
          <div className="mb-6">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Поиск проектов..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                className={`w-full rounded-xl border px-9 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
              />
            </div>
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <select
                value={filterTeamId ?? ''}
                onChange={(e) => {
                  const next = e.target.value ? Number(e.target.value) : null
                  setFilterTeamId(next)
                  const nextParams = buildPageQueryParams(searchParams, 1, searchTerm)
                  setSearchParams(nextParams, { replace: true })
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
              >
                <option value="">Все команды</option>
                {(teamsOptionsQuery.data?.items ?? []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>

              <select
                value={filterStatus}
                onChange={(e) => {
                  const next = (e.target.value || '') as ProjectStatus | ''
                  setFilterStatus(next)
                  const nextParams = buildPageQueryParams(searchParams, 1, searchTerm)
                  setSearchParams(nextParams, { replace: true })
                }}
                className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
              >
                <option value="">Все статусы</option>
                {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
              <div className="flex items-center gap-2">
                <span>
                  {totalProjects} {totalProjects === 1 ? 'проект' : 'проектов'}
                </span>
                <RefreshBadge isRefreshing={isRefreshing} label="Обновление..." />
              </div>
              {projectsQuery.isFetching && projectsQuery.data ? <span>Обновление списка...</span> : null}
            </div>
          </div>

          {projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 page-load-stagger">
              {projects.map((project, index) => {
                const colorIndex = index % CARD_COLORS.length
                const statusStyle = statusClassMap[project.status]
                const isHighRisk = project.riskSummary.riskLevel === RiskLevel.HIGH
                const isProjectDeletePending = pendingDeleteProjectId === project.id

                return (
                  <div
                    key={project.id}
                    className="group card-hover cursor-pointer rounded-xl border border-[#e8e8e8] bg-white p-6 transition-all duration-200 dark:border-[#313d4f] dark:bg-[#273142] stagger-row"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div
                        className="flex min-w-0 flex-1 items-center gap-3"
                        onClick={() => navigate(`/board/${project.id}`)}
                      >
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${CARD_COLORS[colorIndex]} text-base font-bold text-white`}
                        >
                          {project.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`truncate font-bold ${textPrimary} group-hover:text-[#4880ff] transition-colors`}>
                            {project.name}
                          </h3>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                            >
                              {PROJECT_STATUS_LABELS[project.status] || project.status}
                            </span>
                            {project.riskSummary.riskLevel !== RiskLevel.LOW ? (
                              <span
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  isHighRisk
                                    ? 'bg-red-500/10 text-red-500'
                                    : 'bg-amber-500/10 text-amber-500'
                                }`}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {isHighRisk ? 'Высокий риск' : 'Средний риск'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div
                        className={`relative ${openMenuId === project.id ? 'z-[70]' : ''}`}
                      >
                        <button
                          type="button"
                          data-project-menu-button-id={project.id}
                          onClick={(event) => {
                            event.stopPropagation()
                            setOpenMenuId((currentMenuId) =>
                              currentMenuId === project.id ? null : project.id,
                            )
                          }}
                          className={`rounded p-1 transition-colors ${moreIconColor}`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openMenuId === project.id ? (
                          <div
                            data-project-menu-id={project.id}
                            className={`dropdown-enter absolute right-0 top-8 z-[80] w-52 overflow-hidden rounded-xl border shadow-xl ${
                              isDark
                                ? 'border-[#313d4f] bg-[#273142]'
                                : 'border-[#e8e8e8] bg-white'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                openMembersModal(project.id)
                                setOpenMenuId(null)
                              }}
                              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${
                                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                              }`}
                            >
                              <Users className="h-4 w-4" />
                              Участники
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                openEditModal(project.id)
                                setOpenMenuId(null)
                              }}
                              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${
                                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                              }`}
                            >
                              <Edit3 className="h-4 w-4" />
                              Редактировать
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleDeleteProject(project.id)
                              }}
                              disabled={isProjectDeletePending}
                              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                              }`}
                            >
                              {isProjectDeletePending ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {isProjectDeletePending ? 'Удаление...' : 'Удалить'}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {project.description ? (
                      <p
                        className={`mb-4 text-sm leading-relaxed ${textSecondary}`}
                        onClick={() => navigate(`/board/${project.id}`)}
                      >
                        {project.description}
                      </p>
                    ) : null}

                    <div
                      className={`flex items-center justify-between border-t pt-4 ${dividerColor}`}
                      onClick={() => navigate(`/board/${project.id}`)}
                    >
                      <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                        <Users className="h-3.5 w-3.5" />
                        <span>{project.teamName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                          <BarChart2 className="h-3.5 w-3.5" />
                          <span>{project.memberCount} уч.</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                          <CalendarIcon className="h-3.5 w-3.5" />
                          <span>{formatShortDate(project.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-[#e8e8e8] py-16 dark:border-[#313d4f] ${
                isDark ? 'bg-[#273142]' : 'bg-white'
              }`}
            >
              <Search className={`h-6 w-6 ${textSecondary}`} />
              <p className={`font-semibold ${textSecondary}`}>
                {searchTerm ? 'Ничего не найдено' : 'Проектов пока нет'}
              </p>
              <p className={`text-xs ${textSecondary}`}>
                {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте первый проект'}
              </p>
            </div>
          )}
        </PageRefreshOverlay>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className={`text-xs ${textSecondary}`}>
            Страница {page} из {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <PaginationButton disabled={page <= 1} onClick={() => updatePage(page - 1)}>
              Назад
            </PaginationButton>
            <PaginationButton disabled={page >= totalPages} onClick={() => updatePage(page + 1)}>
              Вперед
            </PaginationButton>
          </div>
        </div>
      ) : null}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новый проект">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreateProject()
          }}
          className="space-y-4"
        >
          <InputField
            label="Название"
            value={formName}
            onChange={setFormName}
            required
            placeholder="Название проекта"
            hint="Название будет видно в списке проектов."
          />
          <InputField
            label="Описание"
            value={formDescription}
            onChange={setFormDescription}
            placeholder="Описание"
          />
          <SelectField
            label="Команда"
            value={formTeamId}
            onChange={setFormTeamId}
            required
            disabled={teamsOptionsQuery.isPending && !teamsOptionsQuery.data}
            hint={
              teamsOptionsQuery.error instanceof Error && !teamsOptionsQuery.data
                ? teamsOptionsQuery.error.message
                : teamsOptionsQuery.isPending && !teamsOptionsQuery.data
                  ? 'Загружаем список команд...'
                  : 'Проект будет связан с одной командой.'
            }
            options={[
              {
                value: '',
                label:
                  teamsOptionsQuery.isPending && !teamsOptionsQuery.data
                    ? 'Загрузка команд...'
                    : teamsOptionsQuery.data?.items.length
                      ? 'Выберите команду...'
                      : 'Команд нет',
              },
              ...(teamsOptionsQuery.data?.items ?? []).map((team) => ({
                value: String(team.id),
                label: team.name,
              })),
            ]}
          />
          <SelectField
            label="Статус"
            value={formStatus}
            onChange={(value) => setFormStatus(value as ProjectStatus)}
            options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className={`px-4 py-2 text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={formLoading} className="min-w-28">Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать проект">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleEditProject()
          }}
          className="space-y-4"
        >
          <InputField
            label="Название"
            value={formName}
            onChange={setFormName}
            required
            hint="Название будет видно в списке проектов."
          />
          <InputField
            label="Описание"
            value={formDescription}
            onChange={setFormDescription}
            hint="Краткое описание проекта."
          />
          <SelectField
            label="Статус"
            value={formStatus}
            onChange={(value) => setFormStatus(value as ProjectStatus)}
            options={Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
              value,
              label,
            }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className={`px-4 py-2 text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={formLoading} className="min-w-28">Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`Участники: ${selectedProject?.name || ''}`}
      >
        {selectedProject ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={openAddMemberModal}
              className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#4880ff] hover:underline"
            >
              <UserPlus className="h-4 w-4" />
              Добавить участника
            </button>

            {projectMembersLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`project-member-skeleton-${index}`}
                    className="h-12 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5"
                  />
                ))}
              </div>
            ) : projectMembersError && !projectMembersQuery.data ? (
              <div className="space-y-3">
                <ErrorMessage message={projectMembersError} />
                <button
                  type="button"
                  onClick={() => void projectMembersQuery.refetch()}
                  className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
                >
                  Повторить
                </button>
              </div>
            ) : selectedProjectMembers.length > 0 ? (
              <PageRefreshOverlay
                show={projectMembersQuery.isFetching && !!projectMembersQuery.data}
                label="Обновление участников"
              >
                <div className="space-y-0.5">
                  {selectedProjectMembers.map((member) => {
                    const isMemberRemoving = pendingRemoveMemberId === member.id

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center justify-between border-b py-2 last:border-0 ${dividerColor}`}
                      >
                        <div>
                          <p className={`text-sm font-semibold ${textPrimary}`}>
                            {projectMemberNames.get(member.userId) || `#${member.userId}`}
                          </p>
                          <p className={`text-xs ${textSecondary}`}>
                            {PROJECT_ROLE_LABELS[member.role as ProjectRole] || member.role}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleRemoveProjectMember(member.id)}
                          disabled={isMemberRemoving}
                          className="rounded p-1 text-red-500 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isMemberRemoving ? (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </PageRefreshOverlay>
            ) : (
              <p className={`py-4 text-center text-sm ${textSecondary}`}>Участников пока нет</p>
            )}
          </div>
        ) : null}
      </Modal>

      <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Добавить в проект">
        <ErrorMessage message={formError} />
        {memberUsersError || projectTeamMembersError ? (
          <div className="mb-4 space-y-3">
            <ErrorMessage message={memberUsersError || projectTeamMembersError} />
            <button
              type="button"
              onClick={() => void projectMemberUsersQuery.refetch()}
              className="rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
            >
              Повторить
            </button>
          </div>
        ) : null}
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleAddProjectMember()
          }}
          className="space-y-4"
        >
          <SelectField
            label="Пользователь"
            value={memberUserId}
            onChange={setMemberUserId}
            required
            disabled={Boolean(
              memberUsersLoading ||
                projectTeamMembersLoading ||
                memberUsersError ||
                projectTeamMembersError ||
                noAvailableProjectMemberOptions ||
                formLoading,
            )}
            hint={
              memberUsersError || projectTeamMembersError
                ? 'Не удалось загрузить список пользователей.'
                : memberUsersLoading || projectTeamMembersLoading
                  ? 'Подбираем подходящих пользователей...'
                  : noAvailableProjectMemberOptions
                    ? 'Все подходящие участники уже добавлены.'
                    : 'Можно добавить только участников команды.'
            }
            options={[
              {
                value: '',
                label:
                  memberUsersLoading || projectTeamMembersLoading
                    ? 'Загрузка...'
                    : memberUsersError || projectTeamMembersError
                      ? 'Источник недоступен'
                      : noAvailableProjectMemberOptions
                        ? 'Нет доступных пользователей'
                        : 'Выберите...',
              },
              ...availableProjectMemberOptions.map((user) => ({
                value: String(user.id),
                label: `${user.fullName} (${user.login})`,
              })),
            ]}
          />
          <SelectField
            label="Роль в проекте"
            value={memberRole}
            onChange={(value) => setMemberRole(value as ProjectRole)}
            hint="Роль задаётся только для этого проекта."
            options={Object.entries(PROJECT_ROLE_LABELS)
              .filter(([value]) => value !== ProjectRole.TEAM_LEAD)
              .map(([value, label]) => ({
                value,
                label,
              }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddMemberModal(false)}
              className={`px-4 py-2 text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton
              loading={formLoading}
              disabled={Boolean(
                memberUsersLoading ||
                  projectTeamMembersLoading ||
                  memberUsersError ||
                  projectTeamMembersError ||
                  noAvailableProjectMemberOptions,
              )}
              className="min-w-28"
            >
              Добавить
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </PageShell>
  )
}






