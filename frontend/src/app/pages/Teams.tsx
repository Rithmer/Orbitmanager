import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Plus,
  MoreVertical,
  Users,
  CheckCircle2,
  Search,
  Trash2,
  Edit3,
  UserPlus,
  Crown,
  Eye,
} from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { teamsApi } from '../api/teams'
import { ErrorMessage, Modal, InputField, SelectField, SubmitButton } from '../components/Modal'
import { PageShell, PageShellSectionSkeleton } from '../components/PageShell'
import { TeamRole, TEAM_ROLE_LABELS } from '../types'
import { useTeamMemberUsersQuery, useTeamsListViewQuery } from '../features/teams'

const PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300

const CARD_COLORS = [
  'bg-[#4880ff]',
  'bg-[#10b981]',
  'bg-[#8b5cf6]',
  'bg-[#f59e0b]',
  'bg-[#ef4444]',
  'bg-[#ec4899]',
]

const CARD_LIGHT_BACKGROUNDS = [
  'bg-blue-50 dark:bg-[#4880ff]/10',
  'bg-emerald-50 dark:bg-emerald-500/10',
  'bg-purple-50 dark:bg-purple-500/10',
  'bg-amber-50 dark:bg-amber-500/10',
  'bg-red-50 dark:bg-red-500/10',
  'bg-pink-50 dark:bg-pink-500/10',
]

const CARD_TEXT_COLORS = [
  'text-[#4880ff]',
  'text-emerald-500',
  'text-purple-500',
  'text-amber-500',
  'text-red-500',
  'text-pink-500',
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

export function Teams() {
  const { isDark } = useTheme()
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = readPositiveInt(searchParams.get('page'), 1)
  const searchTerm = searchParams.get('search') ?? ''

  const [searchInput, setSearchInput] = useState(searchTerm)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingTeamId, setEditingTeamId] = useState<number | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState(TeamRole.MEMBER)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const teamsQuery = useTeamsListViewQuery({
    page,
    limit: PAGE_SIZE,
    search: searchTerm || undefined,
  })
  const teamMembersQuery = useTeamMemberUsersQuery(showAddMemberModal)

  const isInitialLoading = teamsQuery.isPending && !teamsQuery.data
  const listError = teamsQuery.error instanceof Error ? teamsQuery.error.message : ''
  const totalTeams = teamsQuery.data?.total ?? 0
  const totalPages = teamsQuery.data?.totalPages ?? 1
  const teams = teamsQuery.data?.items ?? []
  const selectedTeam = teams.find((team) => team.id === selectedTeamId) ?? null

  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const avatarBg = isDark ? 'bg-[#313d4f]' : 'bg-gray-100'
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

    return () => {
      clearTimeout(timeoutId)
    }
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
    if (!showAddMemberModal) {
      setFormError('')
      return
    }

    const candidateIds = new Set((selectedTeam?.members ?? []).map((member) => member.userId))
    const availableUsers = teamMembersQuery.data?.items.filter(
      (user) => !candidateIds.has(user.id),
    )

    if (!memberUserId && availableUsers && availableUsers.length > 0) {
      setMemberUserId(String(availableUsers[0].id))
    }
  }, [memberUserId, selectedTeam, showAddMemberModal, teamMembersQuery.data])

  const availableUsers = useMemo(() => {
    const candidateIds = new Set((selectedTeam?.members ?? []).map((member) => member.userId))
    return (teamMembersQuery.data?.items ?? []).filter((user) => !candidateIds.has(user.id))
  }, [selectedTeam, teamMembersQuery.data])

  const updatePage = (nextPage: number) => {
    const nextParams = buildPageQueryParams(searchParams, nextPage, searchTerm)
    setSearchParams(nextParams)
  }

  const openCreateModal = () => {
    setFormName('')
    setFormDescription('')
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (teamId: number) => {
    const team = teams.find((item) => item.id === teamId)
    if (!team) {
      return
    }

    setEditingTeamId(teamId)
    setFormName(team.name)
    setFormDescription(team.description || '')
    setFormError('')
    setShowEditModal(true)
  }

  const openAddMemberModal = (teamId: number) => {
    setSelectedTeamId(teamId)
    setMemberUserId('')
    setMemberRole(TeamRole.MEMBER)
    setFormError('')
    setShowAddMemberModal(true)
  }

  const invalidateTeamQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['teams'] })
    await queryClient.invalidateQueries({ queryKey: ['projects'] })
  }

  const handleCreateTeam = async () => {
    setFormLoading(true)
    setFormError('')

    try {
      await teamsApi.create({
        name: formName.trim(),
        description: formDescription.trim() || undefined,
      })
      setShowCreateModal(false)
      await invalidateTeamQueries()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось создать команду')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEditTeam = async () => {
    if (editingTeamId === null) {
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      await teamsApi.update(editingTeamId, {
        name: formName.trim(),
        description: formDescription.trim() || undefined,
      })
      setShowEditModal(false)
      setEditingTeamId(null)
      await invalidateTeamQueries()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось обновить команду')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Удалить команду? Это действие нельзя отменить.')) {
      return
    }

    try {
      await teamsApi.delete(teamId)
      setOpenMenuId(null)
      await invalidateTeamQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось удалить команду')
    }
  }

  const handleAddMember = async () => {
    if (selectedTeamId === null) {
      return
    }

    setFormLoading(true)
    setFormError('')

    try {
      await teamsApi.addMember(selectedTeamId, {
        userId: Number(memberUserId),
        teamRole: memberRole,
      })
      setShowAddMemberModal(false)
      await invalidateTeamQueries()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Не удалось добавить участника')
    } finally {
      setFormLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Удалить участника из команды?')) {
      return
    }

    try {
      await teamsApi.removeMember(memberId)
      await invalidateTeamQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось удалить участника')
    }
  }

  const handleChangeRole = async (memberId: number, nextRole: TeamRole) => {
    try {
      await teamsApi.updateMember(memberId, { teamRole: nextRole })
      await invalidateTeamQueries()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Не удалось изменить роль')
    }
  }

  const roleIcon = (role: TeamRole) => {
    if (role === TeamRole.OWNER) {
      return <Crown className="h-3 w-3 text-amber-500" />
    }

    if (role === TeamRole.OBSERVER) {
      return <Eye className="h-3 w-3 text-purple-500" />
    }

    return null
  }

  return (
    <PageShell
      title="Команды"
      description="Серверная пагинация и inline-участники для текущей страницы списка."
      actions={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3a6fe0] btn-fizzy"
        >
          <Plus className="h-4 w-4" />
          Новая команда
        </button>
      }
    >
      <div className="mb-6">
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`} />
          <input
            type="text"
            placeholder="Поиск по командам и участникам..."
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            className={`w-full rounded-xl border px-9 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
          />
        </div>
        <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
          <span>
            {totalTeams} {totalTeams === 1 ? 'команда' : 'команд'}
          </span>
          {teamsQuery.isFetching && teamsQuery.data ? <span>Обновление списка...</span> : null}
        </div>
      </div>

      {listError && !teamsQuery.data ? <ErrorMessage message={listError} /> : null}
      {teamsQuery.isError && teamsQuery.data ? <ErrorMessage message={listError} /> : null}

      {isInitialLoading ? (
        <PageShellSectionSkeleton rows={4} />
      ) : teams.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team, index) => {
            const colorIndex = index % CARD_COLORS.length
            const ownerAccess = team.currentUserRole === TeamRole.OWNER
            const members = team.members

            return (
              <div
                key={team.id}
                className="card-hover rounded-xl border border-[#e8e8e8] bg-white p-6 transition-all duration-200 dark:border-[#313d4f] dark:bg-[#273142]"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${CARD_COLORS[colorIndex]} text-lg font-bold text-white`}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`truncate font-bold ${textPrimary}`}>{team.name}</h3>
                      {team.description ? (
                        <p className={`mt-0.5 text-xs ${textSecondary}`}>{team.description}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId((currentMenuId) =>
                          currentMenuId === team.id ? null : team.id,
                        )
                      }
                      className={`rounded p-1 transition-colors ${moreIconColor}`}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {openMenuId === team.id ? (
                      <div
                        className={`dropdown-enter absolute right-0 top-8 z-10 w-48 overflow-hidden rounded-xl border shadow-xl ${
                          isDark
                            ? 'border-[#313d4f] bg-[#273142]'
                            : 'border-[#e8e8e8] bg-white'
                        }`}
                      >
                        {ownerAccess ? (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                openEditModal(team.id)
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
                              onClick={() => {
                                openAddMemberModal(team.id)
                                setOpenMenuId(null)
                              }}
                              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${
                                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                              }`}
                            >
                              <UserPlus className="h-4 w-4" />
                              Добавить участника
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTeam(team.id)}
                              className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 ${
                                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                              }`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Удалить
                            </button>
                          </>
                        ) : (
                          <div className={`px-4 py-2.5 text-xs ${textSecondary}`}>
                            Только владелец может управлять
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className={`${CARD_LIGHT_BACKGROUNDS[colorIndex]} flex items-center gap-2 rounded-lg px-3 py-2`}>
                    <Users className={`h-4 w-4 ${CARD_TEXT_COLORS[colorIndex]}`} />
                    <div>
                      <div className={`text-sm font-bold ${CARD_TEXT_COLORS[colorIndex]}`}>
                        {team.memberCount}
                      </div>
                      <div className={`text-xs ${textSecondary}`}>Участников</div>
                    </div>
                  </div>
                  <div className={`${CARD_LIGHT_BACKGROUNDS[colorIndex]} flex items-center gap-2 rounded-lg px-3 py-2`}>
                    <CheckCircle2 className={`h-4 w-4 ${CARD_TEXT_COLORS[colorIndex]}`} />
                    <div>
                      <div className={`text-sm font-bold ${CARD_TEXT_COLORS[colorIndex]}`}>
                        {formatShortDate(team.createdAt)}
                      </div>
                      <div className={`text-xs ${textSecondary}`}>Создана</div>
                    </div>
                  </div>
                </div>

                <div className={`border-t pt-4 ${dividerColor}`}>
                  <p className={`mb-3 text-xs font-semibold uppercase tracking-wider ${textSecondary}`}>
                    Участники
                  </p>
                  <div className="space-y-2.5">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarBg} ${textSecondary}`}
                          >
                            {member.user.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className={`flex items-center gap-1 text-xs font-semibold ${textPrimary}`}>
                              <span className="truncate">{member.user.fullName}</span>
                              {roleIcon(member.teamRole)}
                            </div>
                            <div className={`text-xs ${textSecondary}`}>
                              {TEAM_ROLE_LABELS[member.teamRole] || member.teamRole}
                              {member.user.profession ? ` · ${member.user.profession}` : ''}
                            </div>
                          </div>
                        </div>
                        {ownerAccess && member.userId !== currentUser?.id ? (
                          <div className="flex items-center gap-1">
                            <select
                              value={member.teamRole}
                              onChange={(event) =>
                                handleChangeRole(member.id, event.target.value as TeamRole)
                              }
                              className={`rounded border px-1.5 py-0.5 text-xs ${
                                isDark
                                  ? 'border-[#313d4f] bg-[#1c2534] text-[#f4f3f2]'
                                  : 'border-gray-200 bg-gray-50 text-[#202224]'
                              }`}
                            >
                              {Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleRemoveMember(member.id)}
                              className="rounded p-1 text-red-500 transition-colors hover:bg-red-500/10"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : null}
                      </div>
                    ))}
                    {members.length === 0 ? (
                      <p className={`py-2 text-center text-xs ${textSecondary}`}>Нет участников</p>
                    ) : null}
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
            {searchTerm ? 'Ничего не найдено' : 'Команд пока нет'}
          </p>
          <p className={`text-xs ${textSecondary}`}>
            {searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте первую команду'}
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

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новая команда">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreateTeam()
          }}
          className="space-y-4"
        >
          <InputField
            label="Название"
            value={formName}
            onChange={setFormName}
            required
            placeholder="Название команды"
          />
          <InputField
            label="Описание"
            value={formDescription}
            onChange={setFormDescription}
            placeholder="Описание команды"
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

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать команду">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleEditTeam()
          }}
          className="space-y-4"
        >
          <InputField label="Название" value={formName} onChange={setFormName} required />
          <InputField label="Описание" value={formDescription} onChange={setFormDescription} />
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

      <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Добавить участника">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleAddMember()
          }}
          className="space-y-4"
        >
          <SelectField
            label="Пользователь"
            value={memberUserId}
            onChange={setMemberUserId}
            required
            options={[
              { value: '', label: 'Выберите пользователя...' },
              ...availableUsers.map((user) => ({
                value: String(user.id),
                label: `${user.fullName} (${user.login})`,
              })),
            ]}
          />
          <SelectField
            label="Роль в команде"
            value={memberRole}
            onChange={(value) => setMemberRole(value as TeamRole)}
            options={Object.entries(TEAM_ROLE_LABELS).map(([value, label]) => ({
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
