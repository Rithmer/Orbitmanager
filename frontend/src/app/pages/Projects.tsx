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
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router'
import { useTheme } from '../context/useTheme'
import { projectsApi } from '../api/projects'
import { ErrorMessage, Modal, InputField, SelectField, SubmitButton } from '../components/Modal'
import { PageShell, PageShellSectionSkeleton } from '../components/PageShell'
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

  const projectsQuery = useProjectsListViewQuery({
    page,
    limit: PAGE_SIZE,
    search: searchTerm || undefined,
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
  const teamsOptionsQuery = useProjectTeamOptionsQuery(showCreateModal)

  const isInitialLoading = projectsQuery.isPending && !projectsQuery.data
  const listError = projectsQuery.error instanceof Error ? projectsQuery.error.message : ''
  const totalProjects = projectsQuery.data?.total ?? 0
  const totalPages = projectsQuery.data?.totalPages ?? 1
  const selectedProjectMembers = useMemo(() => projectMembersQuery.data ?? [], [projectMembersQuery.data])
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
  }, [page, searchTerm])

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

    try {
      await projectsApi.delete(projectId)
      setOpenMenuId(null)
      await invalidateProjectQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось удалить проект')
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
    if (!confirm('Убрать участника из проекта?')) {
      return
    }

    try {
      await projectsApi.removeMember(memberId)
      await invalidateProjectQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось удалить участника')
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
        <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
          <span>
            {totalProjects} {totalProjects === 1 ? 'проект' : 'проектов'}
          </span>
          {projectsQuery.isFetching && projectsQuery.data ? <span>Обновление списка...</span> : null}
        </div>
      </div>

      {listError && !projectsQuery.data ? <ErrorMessage message={listError} /> : null}
      {projectsQuery.isError && projectsQuery.data ? <ErrorMessage message={listError} /> : null}

      {isInitialLoading ? (
        <PageShellSectionSkeleton rows={4} />
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, index) => {
            const colorIndex = index % CARD_COLORS.length
            const statusStyle = statusClassMap[project.status]
            const isHighRisk = project.riskSummary.riskLevel === RiskLevel.HIGH

            return (
              <div
                key={project.id}
                className="group card-hover cursor-pointer rounded-xl border border-[#e8e8e8] bg-white p-6 transition-all duration-200 dark:border-[#313d4f] dark:bg-[#273142]"
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
                  <div className="relative">
                    <button
                      type="button"
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
                        className={`dropdown-enter absolute right-0 top-8 z-10 w-52 overflow-hidden rounded-xl border shadow-xl ${
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
                          className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 ${
                            isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                          }`}
                        >
                          <Trash2 className="h-4 w-4" />
                          Удалить
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
            options={[
              { value: '', label: teamsOptionsQuery.isFetching ? 'Загрузка команд...' : 'Выберите команду...' },
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
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
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
          <InputField label="Название" value={formName} onChange={setFormName} required />
          <InputField label="Описание" value={formDescription} onChange={setFormDescription} />
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
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
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

            {projectMembersQuery.isPending && !projectMembersQuery.data ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`project-member-skeleton-${index}`}
                    className="h-12 rounded-lg skeleton-shimmer bg-black/5 dark:bg-white/5"
                  />
                ))}
              </div>
            ) : null}

            {selectedProjectMembers.map((member) => (
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
                  onClick={() => handleRemoveProjectMember(member.id)}
                  className="rounded p-1 text-red-500 transition-colors hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}

            {!projectMembersQuery.isPending && selectedProjectMembers.length === 0 ? (
              <p className={`py-4 text-center text-sm ${textSecondary}`}>Участников пока нет</p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Добавить в проект">
        <ErrorMessage message={formError} />
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
            options={[
              {
                value: '',
                label: projectMemberUsersQuery.isFetching ? 'Загрузка...' : 'Выберите...',
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
            options={Object.entries(PROJECT_ROLE_LABELS).map(([value, label]) => ({
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
            <SubmitButton loading={formLoading}>Добавить</SubmitButton>
          </div>
        </form>
      </Modal>
    </PageShell>
  )
}
