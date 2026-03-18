import { useState, useEffect, useCallback } from 'react'
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
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { teamsApi } from '../api/teams'
import { usersApi } from '../api/users'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import type { Team, TeamMember, User } from '../types'
import { TeamRole, TEAM_ROLE_LABELS } from '../types'

export function Teams() {
  const { isDark } = useTheme()
  const { user: currentUser } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [teams, setTeams] = useState<Team[]>([])
  const [teamMembers, setTeamMembers] = useState<Record<number, TeamMember[]>>({})
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState(TeamRole.MEMBER)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
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

  const colors = ['bg-[#4880ff]', 'bg-[#10b981]', 'bg-[#8b5cf6]', 'bg-[#f59e0b]', 'bg-[#ef4444]', 'bg-[#ec4899]']
  const textColors = ['text-[#4880ff]', 'text-emerald-500', 'text-purple-500', 'text-amber-500', 'text-red-500', 'text-pink-500']
  const lightBgs = [
    isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
    isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
    isDark ? 'bg-purple-500/10' : 'bg-purple-50',
    isDark ? 'bg-amber-500/10' : 'bg-amber-50',
    isDark ? 'bg-red-500/10' : 'bg-red-50',
    isDark ? 'bg-pink-500/10' : 'bg-pink-50',
  ]

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [teamsRes, usersRes] = await Promise.all([
        teamsApi.list({ limit: 100 }),
        usersApi.list({ limit: 100 }),
      ])
      setTeams(teamsRes.items)
      setAllUsers(usersRes.items)

      const membersMap: Record<number, TeamMember[]> = {}
      const membersList = await Promise.all(
        teamsRes.items.map((team) => teamsApi.getMembers(team.id)),
      )
      teamsRes.items.forEach((team, index) => {
        membersMap[team.id] = membersList[index] || []
      })
      setTeamMembers(membersMap)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getUserName = (userId: number) => {
    const u = allUsers.find((u) => u.id === userId)
    return u?.fullName || `Пользователь #${userId}`
  }

  const getUserRole = (userId: number) => {
    const u = allUsers.find((u) => u.id === userId)
    return u?.profession || ''
  }

  const isTeamOwner = (teamId: number) => {
    const members = teamMembers[teamId] || []
    return members.some((m) => m.userId === currentUser?.id && m.teamRole === TeamRole.OWNER)
  }

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await teamsApi.create({ name: formName, description: formDesc || undefined })
      setShowCreateModal(false)
      setFormName('')
      setFormDesc('')
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingTeam) return
    setFormLoading(true)
    setFormError('')
    try {
      await teamsApi.update(editingTeam.id, { name: formName, description: formDesc || undefined })
      setShowEditModal(false)
      setEditingTeam(null)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка обновления')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (teamId: number) => {
    if (!confirm('Удалить команду? Это действие нельзя отменить.')) return
    try {
      await teamsApi.delete(teamId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления')
    }
  }

  const handleAddMember = async () => {
    if (!selectedTeamId) return
    setFormLoading(true)
    setFormError('')
    try {
      await teamsApi.addMember(selectedTeamId, {
        userId: Number(memberUserId),
        teamRole: memberRole,
      })
      setShowAddMemberModal(false)
      setMemberUserId('')
      setMemberRole(TeamRole.MEMBER)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка добавления')
    } finally {
      setFormLoading(false)
    }
  }

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Удалить участника из команды?')) return
    try {
      await teamsApi.removeMember(memberId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка удаления участника')
    }
  }

  const handleChangeRole = async (memberId: number, newRole: TeamRole) => {
    try {
      await teamsApi.updateMember(memberId, { teamRole: newRole })
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка смены роли')
    }
  }

  const filteredTeams = teams.filter(
    (team) =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (team.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const roleIcon = (role: TeamRole) => {
    if (role === TeamRole.OWNER) return <Crown className="w-3 h-3 text-amber-500" />
    if (role === TeamRole.OBSERVER) return <Eye className="w-3 h-3 text-purple-500" />
    return null
  }

  if (loading) {
    return (
      <div className={`${pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`${pageBg} min-h-full p-8`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Команды</h1>
          <p className={`mt-1 text-sm ${textSecondary}`}>
            {teams.length} команд
          </p>
        </div>
        <button
          onClick={() => {
            setFormName('')
            setFormDesc('')
            setFormError('')
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Новая команда
        </button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="relative mb-6">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
        <input
          type="text"
          placeholder="Поиск команд..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredTeams.length > 0 ? (
          filteredTeams.map((team, idx) => {
            const ci = idx % colors.length
            const members = teamMembers[team.id] || []
            const ownerAccess = isTeamOwner(team.id)

            return (
              <div
                key={team.id}
                className={`${cardBg} border ${cardBorder} rounded-xl p-6 hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 ${colors[ci]} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}
                    >
                      {team.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className={`font-bold ${textPrimary}`}>{team.name}</h3>
                      {team.description && (
                        <p className={`text-xs mt-0.5 ${textSecondary}`}>{team.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === team.id ? null : team.id)}
                      className={`p-1 rounded ${moreIconColor} transition-colors`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === team.id && (
                      <div
                        className={`absolute right-0 top-8 z-10 w-48 rounded-xl shadow-xl border overflow-hidden ${
                          isDark ? 'bg-[#273142] border-[#313d4f]' : 'bg-white border-[#e8e8e8]'
                        }`}
                      >
                        {ownerAccess && (
                          <>
                            <button
                              onClick={() => {
                                setEditingTeam(team)
                                setFormName(team.name)
                                setFormDesc(team.description || '')
                                setFormError('')
                                setShowEditModal(true)
                                setOpenMenuId(null)
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                            >
                              <Edit3 className="w-4 h-4" /> Редактировать
                            </button>
                            <button
                              onClick={() => {
                                setSelectedTeamId(team.id)
                                setMemberUserId('')
                                setMemberRole(TeamRole.MEMBER)
                                setFormError('')
                                setShowAddMemberModal(true)
                                setOpenMenuId(null)
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                            >
                              <UserPlus className="w-4 h-4" /> Добавить участника
                            </button>
                            <button
                              onClick={() => {
                                handleDelete(team.id)
                                setOpenMenuId(null)
                              }}
                              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                            >
                              <Trash2 className="w-4 h-4" /> Удалить
                            </button>
                          </>
                        )}
                        {!ownerAccess && (
                          <div className={`px-4 py-2.5 text-xs ${textSecondary}`}>Только владелец может управлять</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`${lightBgs[ci]} rounded-lg px-3 py-2 flex items-center gap-2`}>
                    <Users className={`w-4 h-4 ${textColors[ci]}`} />
                    <div>
                      <div className={`text-sm font-bold ${textColors[ci]}`}>{members.length}</div>
                      <div className={`text-xs ${textSecondary}`}>Участников</div>
                    </div>
                  </div>
                  <div className={`${lightBgs[ci]} rounded-lg px-3 py-2 flex items-center gap-2`}>
                    <CheckCircle2 className={`w-4 h-4 ${textColors[ci]}`} />
                    <div>
                      <div className={`text-sm font-bold ${textColors[ci]}`}>
                        {new Date(team.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </div>
                      <div className={`text-xs ${textSecondary}`}>Создана</div>
                    </div>
                  </div>
                </div>

                <div className={`border-t ${dividerColor} pt-4`}>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-3 ${textSecondary}`}>
                    Участники
                  </p>
                  <div className="space-y-2.5">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-8 h-8 ${avatarBg} rounded-full flex items-center justify-center text-xs font-bold ${textSecondary}`}
                          >
                            {getUserName(member.userId).charAt(0)}
                          </div>
                          <div>
                            <div className={`text-xs font-semibold flex items-center gap-1 ${textPrimary}`}>
                              {getUserName(member.userId)}
                              {roleIcon(member.teamRole as TeamRole)}
                            </div>
                            <div className={`text-xs ${textSecondary}`}>
                              {TEAM_ROLE_LABELS[member.teamRole as TeamRole] || member.teamRole}
                              {getUserRole(member.userId) && ` · ${getUserRole(member.userId)}`}
                            </div>
                          </div>
                        </div>
                        {ownerAccess && member.userId !== currentUser?.id && (
                          <div className="flex items-center gap-1">
                            <select
                              value={member.teamRole}
                              onChange={(e) => handleChangeRole(member.id, e.target.value as TeamRole)}
                              className={`text-xs px-1.5 py-0.5 rounded border ${
                                isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-gray-50 border-gray-200 text-[#202224]'
                              }`}
                            >
                              {Object.entries(TEAM_ROLE_LABELS).map(([val, lab]) => (
                                <option key={val} value={val}>{lab}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {members.length === 0 && (
                      <p className={`text-xs ${textSecondary} text-center py-2`}>Нет участников</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className={`col-span-2 flex flex-col items-center justify-center py-16 gap-3 ${cardBg} border ${cardBorder} rounded-xl`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <Search className={`w-6 h-6 ${textSecondary}`} />
            </div>
            <p className={`font-semibold ${textSecondary}`}>
              {searchQuery ? 'Ничего не найдено' : 'Команд пока нет'}
            </p>
            <p className={`text-xs ${textSecondary}`}>
              {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте первую команду'}
            </p>
          </div>
        )}
      </div>

      {/* Create Team Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новая команда">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleCreate()
          }}
          className="space-y-4"
        >
          <InputField label="Название" value={formName} onChange={setFormName} required placeholder="Название команды" />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} placeholder="Описание команды" />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>
              Отмена
            </button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Edit Team Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать команду">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleEdit()
          }}
          className="space-y-4"
        >
          <InputField label="Название" value={formName} onChange={setFormName} required />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>
              Отмена
            </button>
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Add Member Modal */}
      <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Добавить участника">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleAddMember()
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
              ...allUsers
                .filter((u) => {
                  const members = selectedTeamId ? teamMembers[selectedTeamId] || [] : []
                  return !members.some((m) => m.userId === u.id)
                })
                .map((u) => ({ value: String(u.id), label: `${u.fullName} (${u.login})` })),
            ]}
          />
          <SelectField
            label="Роль в команде"
            value={memberRole}
            onChange={(v) => setMemberRole(v as TeamRole)}
            options={Object.entries(TEAM_ROLE_LABELS).map(([val, lab]) => ({ value: val, label: lab }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddMemberModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>
              Отмена
            </button>
            <SubmitButton loading={formLoading}>Добавить</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
