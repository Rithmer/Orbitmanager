import { useState, useEffect, useCallback } from 'react'
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
import { useNavigate } from 'react-router'
import { useTheme } from '../context/ThemeContext'
import { projectsApi } from '../api/projects'
import { teamsApi } from '../api/teams'
import { usersApi } from '../api/users'
import { riskApi } from '../api/risk'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import type { Project, Team, TeamMember, ProjectMember, User, ProjectRiskOutput } from '../types'
import {
  ProjectStatus,
  PROJECT_STATUS_LABELS,
  ProjectRole,
  PROJECT_ROLE_LABELS,
  RiskLevel,
} from '../types'

export function Projects() {
  const navigate = useNavigate()
  const { isDark } = useTheme()

  const [projects, setProjects] = useState<Project[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [projectMembers, setProjectMembers] = useState<Record<number, ProjectMember[]>>({})
  const [teamMembersMap, setTeamMembersMap] = useState<Record<number, TeamMember[]>>({})
  const [projectRisks, setProjectRisks] = useState<Record<number, ProjectRiskOutput>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formTeamId, setFormTeamId] = useState('')
  const [formStatus, setFormStatus] = useState(ProjectStatus.ACTIVE)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState(ProjectRole.DEVELOPER)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const moreIconColor = isDark
    ? 'text-[#94a3b8] hover:text-[#f4f3f2]'
    : 'text-gray-400 hover:text-gray-600'
  const inputBg = isDark
    ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]'
    : 'bg-white border-[#e8e8e8] text-[#202224]'

  const colors = ['bg-[#4880ff]', 'bg-[#10b981]', 'bg-[#8b5cf6]', 'bg-[#f59e0b]', 'bg-[#ef4444]']

  const statusConfig: Record<string, { bg: string; text: string }> = {
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

  const loadData = useCallback(async () => {
    setLoadError('')
    try {
      const [projectsRes, teamsRes, usersRes] = await Promise.all([
        projectsApi.list({ limit: 100 }),
        teamsApi.list({ limit: 100 }),
        usersApi.list({ limit: 100 }),
      ])
      setProjects(projectsRes.items)
      setTeams(teamsRes.items)
      setAllUsers(usersRes.items)

      const membersMap: Record<number, ProjectMember[]> = {}
      const tmMap: Record<number, TeamMember[]> = {}
      const [projectMembersList, teamMembersList] = await Promise.all([
        Promise.all(projectsRes.items.map((project) => projectsApi.getMembers(project.id))),
        Promise.all(teamsRes.items.map((team) => teamsApi.getMembers(team.id))),
      ])

      projectsRes.items.forEach((project, index) => {
        membersMap[project.id] = projectMembersList[index] || []
      })
      teamsRes.items.forEach((team, index) => {
        tmMap[team.id] = teamMembersList[index] || []
      })
      setProjectMembers(membersMap)
      setTeamMembersMap(tmMap)

      const risksMap: Record<number, ProjectRiskOutput> = {}
      const projectRisksList = await Promise.all(
        projectsRes.items.map((project) => riskApi.getProjectRisk(project.id)),
      )
      projectsRes.items.forEach((project, index) => {
        risksMap[project.id] = projectRisksList[index] as ProjectRiskOutput
      })
      setProjectRisks(risksMap)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getTeamName = (teamId: number) => teams.find((t) => t.id === teamId)?.name || `Команда #${teamId}`

  const getUserName = (userId: number) => allUsers.find((u) => u.id === userId)?.fullName || `#${userId}`

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await projectsApi.create({
        name: formName,
        description: formDesc || undefined,
        teamId: Number(formTeamId),
        status: formStatus,
      })
      setShowCreateModal(false)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingProject) return
    setFormLoading(true)
    setFormError('')
    try {
      await projectsApi.update(editingProject.id, {
        name: formName,
        description: formDesc || undefined,
        status: formStatus,
      })
      setShowEditModal(false)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить проект?')) return
    try {
      await projectsApi.delete(id)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const handleAddMember = async () => {
    if (!selectedProject) return
    setFormLoading(true)
    setFormError('')
    try {
      await projectsApi.addMember(selectedProject.id, {
        userId: Number(memberUserId),
        role: memberRole,
      })
      setShowAddMemberModal(false)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleRemoveProjectMember = async (memberId: number) => {
    if (!confirm('Убрать участника из проекта?')) return
    try {
      await projectsApi.removeMember(memberId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Проекты</h1>
          <p className={`mt-1 text-sm ${textSecondary}`}>{projects.length} проектов</p>
        </div>
        <button
          onClick={() => {
            setFormName('')
            setFormDesc('')
            setFormTeamId(teams[0]?.id ? String(teams[0].id) : '')
            setFormStatus(ProjectStatus.ACTIVE)
            setFormError('')
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Новый проект
        </button>
      </div>

      <ErrorMessage message={loadError} />

      <div className="relative mb-6">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
        <input
          type="text"
          placeholder="Поиск проектов..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredProjects.length > 0 ? (
          filteredProjects.map((project, idx) => {
            const ci = idx % colors.length
            const st = statusConfig[project.status] || statusConfig[ProjectStatus.ACTIVE]
            const members = projectMembers[project.id] || []
            const risk = projectRisks[project.id]

            return (
              <div
                key={project.id}
                className={`${cardBg} border ${cardBorder} rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-200 group`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0"
                    onClick={() => navigate(`/board/${project.id}`)}
                  >
                    <div
                      className={`w-11 h-11 ${colors[ci]} rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0`}
                    >
                      {project.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold ${textPrimary} group-hover:text-[#4880ff] transition-colors truncate`}>
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.bg} ${st.text}`}>
                          {PROJECT_STATUS_LABELS[project.status as ProjectStatus] || project.status}
                        </span>
                        {risk && risk.riskLevel !== RiskLevel.LOW && (
                          <span
                            className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              risk.riskLevel === RiskLevel.HIGH
                                ? 'bg-red-500/10 text-red-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            {risk.riskLevel === RiskLevel.HIGH ? 'Высокий риск' : 'Средний риск'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setOpenMenuId(openMenuId === project.id ? null : project.id)
                      }}
                      className={`p-1 rounded ${moreIconColor} transition-colors`}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {openMenuId === project.id && (
                      <div
                        className={`absolute right-0 top-8 z-10 w-52 rounded-xl shadow-xl border overflow-hidden ${
                          isDark ? 'bg-[#273142] border-[#313d4f]' : 'bg-white border-[#e8e8e8]'
                        }`}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedProject(project)
                            setShowMembersModal(true)
                            setOpenMenuId(null)
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                        >
                          <Users className="w-4 h-4" /> Участники
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingProject(project)
                            setFormName(project.name)
                            setFormDesc(project.description || '')
                            setFormStatus(project.status as ProjectStatus)
                            setFormError('')
                            setShowEditModal(true)
                            setOpenMenuId(null)
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                        >
                          <Edit3 className="w-4 h-4" /> Редактировать
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(project.id)
                            setOpenMenuId(null)
                          }}
                          className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                        >
                          <Trash2 className="w-4 h-4" /> Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {project.description && (
                  <p className={`text-sm mb-4 leading-relaxed ${textSecondary}`} onClick={() => navigate(`/board/${project.id}`)}>
                    {project.description}
                  </p>
                )}

                <div className={`flex items-center justify-between pt-4 border-t ${dividerColor}`} onClick={() => navigate(`/board/${project.id}`)}>
                  <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                    <Users className="w-3.5 h-3.5" />
                    <span>{getTeamName(project.teamId)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>{members.length} уч.</span>
                    </div>
                    <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>{new Date(project.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className={`col-span-2 flex flex-col items-center justify-center py-16 gap-3 ${cardBg} border ${cardBorder} rounded-xl`}>
            <Search className={`w-6 h-6 ${textSecondary}`} />
            <p className={`font-semibold ${textSecondary}`}>{searchQuery ? 'Ничего не найдено' : 'Проектов пока нет'}</p>
          </div>
        )}
      </div>

      {/* Create Project */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новый проект">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="space-y-4">
          <InputField label="Название" value={formName} onChange={setFormName} required placeholder="Название проекта" />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} placeholder="Описание" />
          <SelectField
            label="Команда"
            value={formTeamId}
            onChange={setFormTeamId}
            required
            options={teams.map((t) => ({ value: String(t.id), label: t.name }))}
          />
          <SelectField
            label="Статус"
            value={formStatus}
            onChange={(v) => setFormStatus(v as ProjectStatus)}
            options={Object.entries(PROJECT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Edit Project */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать проект">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleEdit() }} className="space-y-4">
          <InputField label="Название" value={formName} onChange={setFormName} required />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
          <SelectField
            label="Статус"
            value={formStatus}
            onChange={(v) => setFormStatus(v as ProjectStatus)}
            options={Object.entries(PROJECT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Project Members */}
      <Modal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title={`Участники: ${selectedProject?.name || ''}`}
      >
        {selectedProject && (
          <div className="space-y-3">
            <button
              onClick={() => {
                setMemberUserId('')
                setMemberRole(ProjectRole.DEVELOPER)
                setFormError('')
                setShowAddMemberModal(true)
              }}
              className="flex items-center gap-2 text-[#4880ff] text-sm font-semibold hover:underline mb-4"
            >
              <UserPlus className="w-4 h-4" /> Добавить участника
            </button>
            {(projectMembers[selectedProject.id] || []).map((pm) => (
              <div key={pm.id} className={`flex items-center justify-between py-2 border-b ${dividerColor} last:border-0`}>
                <div>
                  <p className={`text-sm font-semibold ${textPrimary}`}>{getUserName(pm.userId)}</p>
                  <p className={`text-xs ${textSecondary}`}>{PROJECT_ROLE_LABELS[pm.role as ProjectRole] || pm.role}</p>
                </div>
                <button
                  onClick={() => handleRemoveProjectMember(pm.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {(projectMembers[selectedProject.id] || []).length === 0 && (
              <p className={`text-sm ${textSecondary} text-center py-4`}>Участников пока нет</p>
            )}
          </div>
        )}
      </Modal>

      {/* Add Project Member */}
      <Modal open={showAddMemberModal} onClose={() => setShowAddMemberModal(false)} title="Добавить в проект">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleAddMember() }} className="space-y-4">
          <SelectField
            label="Пользователь"
            value={memberUserId}
            onChange={setMemberUserId}
            required
            options={[
              { value: '', label: 'Выберите...' },
              ...(selectedProject
                ? (teamMembersMap[selectedProject.teamId] || [])
                    .filter((tm) => !(projectMembers[selectedProject.id] || []).some((pm) => pm.userId === tm.userId))
                    .map((tm) => ({ value: String(tm.userId), label: getUserName(tm.userId) }))
                : []),
            ]}
          />
          <SelectField
            label="Роль в проекте"
            value={memberRole}
            onChange={(v) => setMemberRole(v as ProjectRole)}
            options={Object.entries(PROJECT_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowAddMemberModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Добавить</SubmitButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}
