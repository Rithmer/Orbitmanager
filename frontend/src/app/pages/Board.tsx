import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router'
import {
  Plus,
  Calendar,
  MoreHorizontal,
  Tag,
  AlertTriangle,
  ArrowLeft,
  Trash2,
  Edit3,
  User as UserIcon,
  Eye,
  Clock,
} from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import { riskApi } from '../api/risk'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import type { Task, Project, ProjectMember, User, TaskRiskOutput } from '../types'
import {
  TaskStatus,
  TASK_STATUS_LABELS,
  ALLOWED_TASK_TRANSITIONS,
  RiskLevel,
  RISK_LEVEL_LABELS,
  ProjectRole,
  PROJECT_ROLE_LABELS,
} from '../types'
import { usersApi } from '../api/users'
import { formatLocalDateInput, toLocalEndOfDayIso } from '../utils/dateTime'

const COLUMNS = [
  { status: TaskStatus.NEW, title: 'К выполнению', accent: '#4880ff' },
  { status: TaskStatus.IN_PROGRESS, title: 'В процессе', accent: '#f59e0b' },
  { status: TaskStatus.REVIEW, title: 'На проверке', accent: '#8b5cf6' },
  { status: TaskStatus.DONE, title: 'Выполнено', accent: '#10b981' },
  { status: TaskStatus.CANCELLED, title: 'Отменено', accent: '#ef4444' },
]

export function Board() {
  const { isDark } = useTheme()
  const { projectId: pid } = useParams()
  const navigate = useNavigate()
  const projectId = Number(pid)

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [taskRisks, setTaskRisks] = useState<Record<number, TaskRiskOutput>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRiskModal, setShowRiskModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailTask, setDetailTask] = useState<Task | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [selectedRisk, setSelectedRisk] = useState<{ task: Task; risk: TaskRiskOutput } | null>(null)
  const [openTaskMenu, setOpenTaskMenu] = useState<number | null>(null)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formDeadline, setFormDeadline] = useState('')
  const [formDifficulty, setFormDifficulty] = useState('3')
  const [formAssignee, setFormAssignee] = useState('')
  const [formStatus, setFormStatus] = useState(TaskStatus.NEW)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const colBg = isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'

  const loadData = useCallback(async () => {
    if (!projectId || projectId === 0) {
      setLoading(false)
      return
    }
    setError('')
    try {
      const [proj, tasksRes, membersRes, usersRes] = await Promise.all([
        projectsApi.getById(projectId),
        tasksApi.list({ projectId, limit: 200 }),
        projectsApi.getMembers(projectId).catch((e) => { console.warn('Failed to load project members:', e); return [] }),
        usersApi.list({ limit: 100 }),
      ])
      setProject(proj)
      setTasks(tasksRes.items)
      setMembers(membersRes as ProjectMember[])
      setAllUsers(usersRes.items)

      try {
        const risksMap = await riskApi.getProjectTasksRisk(projectId)
        setTaskRisks(risksMap)
      } catch (e) {
        console.warn('Failed to load task risks:', e)
      }
    } catch (e) {
      console.error('Board: failed to load data:', e)
      setError('Не удалось загрузить данные доски. Попробуйте обновить страницу.')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const getUserName = (userId: number | null | undefined) => {
    if (!userId) return 'Не назначен'
    return allUsers.find((u) => u.id === userId)?.fullName || `#${userId}`
  }

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await tasksApi.create({
        projectId,
        name: formName,
        description: formDesc || undefined,
        deadline: toLocalEndOfDayIso(formDeadline),
        difficulty: Number(formDifficulty),
        assigneeId: formAssignee ? Number(formAssignee) : undefined,
      })
      setShowCreateModal(false)
      resetForm()
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingTask) return
    setFormLoading(true)
    setFormError('')
    try {
      await tasksApi.update(editingTask.id, {
        name: formName,
        description: formDesc || undefined,
        deadline: formDeadline ? toLocalEndOfDayIso(formDeadline) : undefined,
        difficulty: Number(formDifficulty),
        status: formStatus,
        assigneeId: formAssignee ? Number(formAssignee) : null,
      })
      setShowEditModal(false)
      await loadData()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      await tasksApi.update(task.id, { status: newStatus })
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка смены статуса')
    }
    setOpenTaskMenu(null)
  }

  const handleDelete = async (taskId: number) => {
    if (!confirm('Удалить задачу?')) return
    try {
      await tasksApi.delete(taskId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
    setOpenTaskMenu(null)
  }

  const resetForm = () => {
    setFormName('')
    setFormDesc('')
    setFormDeadline('')
    setFormDifficulty('3')
    setFormAssignee('')
    setFormStatus(TaskStatus.NEW)
    setFormError('')
  }

  const getRiskColor = (level?: RiskLevel) => {
    if (level === RiskLevel.HIGH) return 'text-red-500'
    if (level === RiskLevel.MEDIUM) return 'text-amber-500'
    return 'text-emerald-500'
  }

  const getRiskBg = (level?: RiskLevel) => {
    if (level === RiskLevel.HIGH) return isDark ? 'bg-red-500/10' : 'bg-red-50'
    if (level === RiskLevel.MEDIUM) return isDark ? 'bg-amber-500/10' : 'bg-amber-50'
    return isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'
  }

  if (loading) {
    return (
      <div className={`${pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!projectId || projectId === 0) {
    return (
      <div className={`${pageBg} min-h-full p-8`}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <p className={`text-lg font-bold ${textPrimary}`}>Выберите проект</p>
          <p className={`text-sm ${textSecondary}`}>Перейдите в раздел «Проекты» и выберите проект для просмотра задач</p>
          <button onClick={() => navigate('/projects')} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            Перейти к проектам
          </button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${pageBg} min-h-full p-8`}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="w-10 h-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>{error}</p>
          <button onClick={() => { setLoading(true); loadData() }} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            Повторить
          </button>
        </div>
      </div>
    )
  }

  const assigneeOptions = [
    { value: '', label: 'Не назначен' },
    ...members.map((m) => ({
      value: String(m.userId),
      label: `${getUserName(m.userId)} (${PROJECT_ROLE_LABELS[m.role as ProjectRole] || m.role})`,
    })),
  ]

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#273142] text-[#94a3b8]' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>{project?.name || 'Проект'}</h1>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              Канбан-доска · {tasks.length} задач
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm()
            const tomorrow = new Date()
            tomorrow.setDate(tomorrow.getDate() + 7)
            setFormDeadline(formatLocalDateInput(tomorrow))
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 self-start sm:self-auto btn-fizzy"
        >
          <Plus className="w-4 h-4" />
          Добавить задачу
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4 items-start overflow-x-auto">
        {COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status)
          return (
            <div key={col.status} className={`${colBg} rounded-xl p-4`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: col.accent }} />
                  <span className={`text-sm font-bold ${textPrimary}`}>{col.title}</span>
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: `${col.accent}20`, color: col.accent }}
                  >
                    {columnTasks.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {columnTasks.map((task) => {
                  const risk = taskRisks[task.id]
                  const isOverdue = new Date(task.deadline) < new Date() && task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED
                  const allowedTransitions = ALLOWED_TASK_TRANSITIONS[task.status as TaskStatus] || []

                  return (
                    <div
                      key={task.id}
                      className={`${cardBg} border ${cardBorder} rounded-xl p-4 card-hover transition-all duration-200`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h4 className={`text-sm font-semibold leading-snug ${textPrimary}`}>{task.name}</h4>
                        <div className="relative">
                          <button
                            onClick={() => setOpenTaskMenu(openTaskMenu === task.id ? null : task.id)}
                            className={`shrink-0 ${textSecondary} transition-colors`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                          {openTaskMenu === task.id && (
                            <div className={`absolute right-0 top-6 z-20 w-48 rounded-xl shadow-xl border overflow-hidden ${isDark ? 'bg-[#273142] border-[#313d4f]' : 'bg-white border-[#e8e8e8]'} dropdown-enter`}>
                              <button
                                onClick={() => {
                                  setDetailTask(task)
                                  setShowDetailModal(true)
                                  setOpenTaskMenu(null)
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                              >
                                <Eye className="w-3.5 h-3.5" /> Подробнее
                              </button>
                              <button
                                onClick={() => {
                                  setEditingTask(task)
                                  setFormName(task.name)
                                  setFormDesc(task.description || '')
                                  setFormDeadline(task.deadline ? formatLocalDateInput(task.deadline) : '')
                                  setFormDifficulty(String(task.difficulty))
                                  setFormAssignee(task.assigneeId ? String(task.assigneeId) : '')
                                  setFormStatus(task.status as TaskStatus)
                                  setFormError('')
                                  setShowEditModal(true)
                                  setOpenTaskMenu(null)
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                              >
                                <Edit3 className="w-3.5 h-3.5" /> Редактировать
                              </button>
                              {risk && (
                                <button
                                  onClick={() => {
                                    setSelectedRisk({ task, risk })
                                    setShowRiskModal(true)
                                    setOpenTaskMenu(null)
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                                >
                                  <AlertTriangle className="w-3.5 h-3.5" /> Оценка рисков
                                </button>
                              )}
                              {allowedTransitions.length > 0 && (
                                <div className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
                                  <p className={`px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider ${textSecondary}`}>Перевести в</p>
                                  {allowedTransitions.map((ts) => (
                                    <button
                                      key={ts}
                                      onClick={() => handleStatusChange(task, ts)}
                                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs ${textPrimary} ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                                    >
                                      {TASK_STATUS_LABELS[ts]}
                                    </button>
                                  ))}
                                </div>
                              )}
                              <div className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'}`}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Удалить
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <p className={`text-xs mb-3 leading-relaxed ${textSecondary} line-clamp-2`}>{task.description}</p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mb-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isDark ? 'bg-[#4880ff]/15 text-[#4880ff]' : 'bg-blue-50 text-[#4880ff]'}`}>
                          <Tag className="w-2.5 h-2.5" />
                          {task.difficulty}/5
                        </span>
                        {risk && risk.riskLevel !== RiskLevel.LOW && (
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${getRiskBg(risk.riskLevel)} ${getRiskColor(risk.riskLevel)}`}>
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {RISK_LEVEL_LABELS[risk.riskLevel]}
                          </span>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-500/10 text-red-500">
                            Просрочено
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center justify-between text-xs ${textSecondary} mt-2`}>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                        </div>
                        {task.assigneeId && (
                          <div className="flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            <span className="truncate max-w-[80px]">{getUserName(task.assigneeId)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {columnTasks.length === 0 && (
                  <p className={`text-xs text-center py-4 ${textSecondary}`}>Пусто</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новая задача">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="space-y-4">
          <InputField label="Название" value={formName} onChange={setFormName} required placeholder="Название задачи" />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} placeholder="Описание" />
          <InputField label="Дедлайн" value={formDeadline} onChange={setFormDeadline} type="date" required />
          <SelectField
            label="Сложность"
            value={formDifficulty}
            onChange={setFormDifficulty}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n} — ${ ['Очень лёгкая', 'Лёгкая', 'Средняя', 'Сложная', 'Очень сложная'][n - 1] }` }))}
          />
          <SelectField label="Исполнитель" value={formAssignee} onChange={setFormAssignee} options={assigneeOptions} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Edit Task */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать задачу">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleEdit() }} className="space-y-4">
          <InputField label="Название" value={formName} onChange={setFormName} required />
          <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
          <InputField label="Дедлайн" value={formDeadline} onChange={setFormDeadline} type="date" />
          <SelectField
            label="Сложность"
            value={formDifficulty}
            onChange={setFormDifficulty}
            options={[1, 2, 3, 4, 5].map((n) => ({ value: String(n), label: `${n}` }))}
          />
          <SelectField
            label="Статус"
            value={formStatus}
            onChange={(v) => setFormStatus(v as TaskStatus)}
            options={Object.entries(TASK_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <SelectField label="Исполнитель" value={formAssignee} onChange={setFormAssignee} options={assigneeOptions} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEditModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Risk Modal */}
      <Modal open={showRiskModal} onClose={() => setShowRiskModal(false)} title="Оценка рисков">
        {selectedRisk && (
          <div className="space-y-4">
            <div className={`p-4 rounded-xl ${getRiskBg(selectedRisk.risk.riskLevel)}`}>
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className={`w-5 h-5 ${getRiskColor(selectedRisk.risk.riskLevel)}`} />
                <span className={`font-bold ${getRiskColor(selectedRisk.risk.riskLevel)}`}>
                  Риск: {RISK_LEVEL_LABELS[selectedRisk.risk.riskLevel]}
                </span>
              </div>
              <p className={`text-sm ${textSecondary}`}>
                Вероятность задержки: {Math.round(selectedRisk.risk.delayProbability * 100)}%
              </p>
              {selectedRisk.risk.predictedCompletionDate && (
                <p className={`text-sm ${textSecondary} mt-1`}>
                  Прогноз завершения: {new Date(selectedRisk.risk.predictedCompletionDate).toLocaleDateString('ru-RU')}
                </p>
              )}
            </div>
            {selectedRisk.risk.riskFactors && selectedRisk.risk.riskFactors.length > 0 && (
              <div>
                <p className={`text-sm font-semibold mb-2 ${textPrimary}`}>Факторы риска:</p>
                <ul className="space-y-1">
                  {selectedRisk.risk.riskFactors.map((f, i) => (
                    <li key={i} className={`text-sm ${textSecondary} flex items-start gap-2`}>
                      <span className="text-amber-500 mt-0.5">&#8226;</span> {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {selectedRisk.risk.recommendation && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <p className={`text-xs font-semibold mb-1 ${textSecondary}`}>Рекомендация:</p>
                <p className={`text-sm ${textPrimary}`}>{selectedRisk.risk.recommendation}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Task Detail Modal */}
      <Modal open={showDetailModal} onClose={() => setShowDetailModal(false)} title="Подробности задачи" maxWidth="max-w-xl">
        {detailTask && (() => {
          const risk = taskRisks[detailTask.id]
          const isOverdue = new Date(detailTask.deadline) < new Date() && detailTask.status !== TaskStatus.DONE && detailTask.status !== TaskStatus.CANCELLED
          const statusCol = COLUMNS.find((c) => c.status === detailTask.status)
          return (
            <div className="space-y-5">
              <div>
                <h3 className={`text-lg font-bold ${textPrimary} mb-1`}>{detailTask.name}</h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ backgroundColor: statusCol?.accent || '#4880ff' }}
                  >
                    {TASK_STATUS_LABELS[detailTask.status as TaskStatus] || detailTask.status}
                  </span>
                  {isOverdue && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-500">
                      Просрочено
                    </span>
                  )}
                  {risk && risk.riskLevel !== RiskLevel.LOW && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${getRiskBg(risk.riskLevel)} ${getRiskColor(risk.riskLevel)}`}>
                      <AlertTriangle className="w-3 h-3" />
                      {RISK_LEVEL_LABELS[risk.riskLevel]}
                    </span>
                  )}
                </div>
              </div>

              {detailTask.description && (
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wider mb-1.5 ${textSecondary}`}>Описание</p>
                  <p className={`text-sm leading-relaxed ${textPrimary}`}>{detailTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className={`w-4 h-4 ${textSecondary}`} />
                    <span className={`text-xs font-semibold ${textSecondary}`}>Дедлайн</span>
                  </div>
                  <p className={`text-sm font-bold ${isOverdue ? 'text-red-500' : textPrimary}`}>
                    {new Date(detailTask.deadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className={`w-4 h-4 ${textSecondary}`} />
                    <span className={`text-xs font-semibold ${textSecondary}`}>Сложность</span>
                  </div>
                  <p className={`text-sm font-bold ${textPrimary}`}>
                    {detailTask.difficulty}/5 — {['Очень лёгкая', 'Лёгкая', 'Средняя', 'Сложная', 'Очень сложная'][detailTask.difficulty - 1] || ''}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <UserIcon className={`w-4 h-4 ${textSecondary}`} />
                    <span className={`text-xs font-semibold ${textSecondary}`}>Исполнитель</span>
                  </div>
                  <p className={`text-sm font-bold ${textPrimary}`}>{getUserName(detailTask.assigneeId)}</p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className={`w-4 h-4 ${textSecondary}`} />
                    <span className={`text-xs font-semibold ${textSecondary}`}>Создана</span>
                  </div>
                  <p className={`text-sm font-bold ${textPrimary}`}>
                    {new Date(detailTask.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {risk && (
                <div className={`p-4 rounded-xl ${getRiskBg(risk.riskLevel)}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className={`w-4 h-4 ${getRiskColor(risk.riskLevel)}`} />
                    <span className={`text-sm font-bold ${getRiskColor(risk.riskLevel)}`}>
                      Риск: {RISK_LEVEL_LABELS[risk.riskLevel]}
                    </span>
                  </div>
                  <p className={`text-xs ${textSecondary}`}>
                    Вероятность задержки: {Math.round(risk.delayProbability * 100)}%
                  </p>
                  {risk.recommendation && (
                    <p className={`text-xs mt-1 ${textSecondary}`}>{risk.recommendation}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDetailModal(false)
                    setEditingTask(detailTask)
                    setFormName(detailTask.name)
                    setFormDesc(detailTask.description || '')
                    setFormDeadline(detailTask.deadline ? formatLocalDateInput(detailTask.deadline) : '')
                    setFormDifficulty(String(detailTask.difficulty))
                    setFormAssignee(detailTask.assigneeId ? String(detailTask.assigneeId) : '')
                    setFormStatus(detailTask.status as TaskStatus)
                    setFormError('')
                    setShowEditModal(true)
                  }}
                  className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
                >
                  <Edit3 className="w-4 h-4" /> Редактировать
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
