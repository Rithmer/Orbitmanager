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
  const [loadError, setLoadError] = useState('')

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showRiskModal, setShowRiskModal] = useState(false)
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
    setLoadError('')
    try {
      const [proj, tasksRes, membersRes, usersRes] = await Promise.all([
        projectsApi.getById(projectId),
        tasksApi.list({ projectId, limit: 200 }),
        projectsApi.getMembers(projectId),
        usersApi.list({ limit: 100 }),
      ])
      setProject(proj)
      setTasks(tasksRes.items)
      setMembers(membersRes as ProjectMember[])
      setAllUsers(usersRes.items)

      const risksMap: Record<number, TaskRiskOutput> = {}
      const taskRiskList = await Promise.all(
        tasksRes.items.map((task) => riskApi.getTaskRisk(task.id)),
      )
      tasksRes.items.forEach((task, index) => {
        risksMap[task.id] = taskRiskList[index] as TaskRiskOutput
      })
      setTaskRisks(risksMap)
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Ошибка загрузки данных')
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
        deadline: new Date(formDeadline).toISOString(),
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
        deadline: formDeadline ? new Date(formDeadline).toISOString() : undefined,
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

  const assigneeOptions = [
    { value: '', label: 'Не назначен' },
    ...members.map((m) => ({
      value: String(m.userId),
      label: `${getUserName(m.userId)} (${PROJECT_ROLE_LABELS[m.role as ProjectRole] || m.role})`,
    })),
  ]

  return (
    <div className={`${pageBg} min-h-full p-8`}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/projects')}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#273142] text-[#94a3b8]' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className={`text-2xl font-bold ${textPrimary}`}>{project?.name || 'Проект'}</h1>
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
            setFormDeadline(tomorrow.toISOString().split('T')[0])
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
        >
          <Plus className="w-4 h-4" />
          Добавить задачу
        </button>
      </div>

      <ErrorMessage message={loadError} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
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
                      className={`${cardBg} border ${cardBorder} rounded-xl p-4 hover:shadow-md transition-all duration-200`}
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
                            <div className={`absolute right-0 top-6 z-20 w-48 rounded-xl shadow-xl border overflow-hidden ${isDark ? 'bg-[#273142] border-[#313d4f]' : 'bg-white border-[#e8e8e8]'}`}>
                              <button
                                onClick={() => {
                                  setEditingTask(task)
                                  setFormName(task.name)
                                  setFormDesc(task.description || '')
                                  setFormDeadline(task.deadline ? task.deadline.split('T')[0] : '')
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
    </div>
  )
}
