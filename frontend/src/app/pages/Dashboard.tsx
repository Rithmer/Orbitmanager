import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Plus, ArrowUpRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import { riskApi } from '../api/risk'
import type { Task, Project, ProjectRiskOutput } from '../types'
import { TaskStatus, TASK_STATUS_LABELS } from '../types'
import { useNavigate } from 'react-router'

export function Dashboard() {
  const { isDark } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [risks, setRisks] = useState<ProjectRiskOutput[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'

  const loadData = useCallback(async () => {
    setError('')
    try {
      const [tasksRes, projectsRes] = await Promise.all([
        tasksApi.list({ limit: 10, sort: '-createdAt' }),
        projectsApi.list({ limit: 10 }),
      ])
      setTasks(tasksRes.items)
      setProjects(projectsRes.items)

      try {
        const risksMap = await riskApi.getAllProjectsRisk()
        setRisks(Object.values(risksMap))
      } catch (e) {
        console.warn('Failed to load project risks:', e)
      }
    } catch (e) {
      console.error('Dashboard: failed to load data:', e)
      setError('Не удалось загрузить данные. Попробуйте обновить страницу.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const doneTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length
  const overdueTasks = tasks.filter(
    (t) => new Date(t.deadline) < new Date() && t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED,
  ).length
  const totalTasks = tasks.length
  const progressPercent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const statusStyles: Record<string, { color: string; bg: string; dot: string; label: string }> = {
    [TaskStatus.NEW]: {
      color: 'text-[#4880ff]',
      bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      dot: 'bg-[#4880ff]',
      label: TASK_STATUS_LABELS[TaskStatus.NEW],
    },
    [TaskStatus.IN_PROGRESS]: {
      color: 'text-orange-500',
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      dot: 'bg-orange-500',
      label: TASK_STATUS_LABELS[TaskStatus.IN_PROGRESS],
    },
    [TaskStatus.REVIEW]: {
      color: 'text-purple-500',
      bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
      dot: 'bg-purple-500',
      label: TASK_STATUS_LABELS[TaskStatus.REVIEW],
    },
    [TaskStatus.DONE]: {
      color: 'text-emerald-500',
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      dot: 'bg-emerald-500',
      label: TASK_STATUS_LABELS[TaskStatus.DONE],
    },
    [TaskStatus.CANCELLED]: {
      color: 'text-red-500',
      bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      dot: 'bg-red-500',
      label: TASK_STATUS_LABELS[TaskStatus.CANCELLED],
    },
  }

  const stats = [
    {
      label: 'Выполнено',
      value: String(doneTasks),
      change: `из ${totalTasks} задач`,
      icon: CheckCircle2,
      iconBg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      iconColor: 'text-emerald-500',
    },
    {
      label: 'В процессе',
      value: String(inProgressTasks),
      change: 'активных задач',
      icon: Clock,
      iconBg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      label: 'Просрочено',
      value: String(overdueTasks),
      change: overdueTasks > 0 ? 'Требует внимания' : 'Всё в порядке',
      icon: AlertCircle,
      iconBg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      label: 'Прогресс',
      value: `${progressPercent}%`,
      change: `${projects.length} проектов`,
      icon: TrendingUp,
      iconBg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      iconColor: 'text-[#4880ff]',
    },
  ]

  const riskInsights = risks.flatMap((r) =>
    r.tasksAtRisk.map((t) => ({
      id: t.taskId,
      message: `Задача «${t.taskName}» — вероятность задержки ${Math.round(t.delayProbability * 100)}%`,
      type: t.delayProbability > 0.6 ? 'error' : t.delayProbability > 0.3 ? 'warning' : 'info',
    })),
  )

  const insightStyles = {
    error: {
      bg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      border: isDark ? 'border-red-500/30' : 'border-red-200',
      text: isDark ? 'text-red-400' : 'text-red-700',
      dot: 'bg-red-500',
    },
    warning: {
      bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50',
      border: isDark ? 'border-orange-500/30' : 'border-orange-200',
      text: isDark ? 'text-orange-400' : 'text-orange-700',
      dot: 'bg-orange-500',
    },
    info: {
      bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      border: isDark ? 'border-[#4880ff]/30' : 'border-blue-200',
      text: isDark ? 'text-[#7aa5ff]' : 'text-blue-700',
      dot: 'bg-[#4880ff]',
    },
  }

  if (loading) {
    return (
      <div className={`${pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${pageBg} min-h-full p-8`}>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertCircle className="w-10 h-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>{error}</p>
          <button onClick={() => { setLoading(true); loadData() }} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">
            Повторить
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>
            Добро пожаловать, {user?.fullName?.split(' ')[0] || 'Пользователь'}!
          </h1>
          <p className={`mt-1 text-sm ${textSecondary}`}>
            У вас {inProgressTasks} активных задач
          </p>
        </div>
        <button
          onClick={() => navigate('/projects')}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 self-start sm:self-auto btn-fizzy"
        >
          <Plus className="w-4 h-4" />
          Создать проект
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-5 mb-6 md:mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`${cardBg} border ${cardBorder} rounded-xl p-5 card-hover`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div className="min-w-0">
                <div className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</div>
                <div className={`text-sm ${textSecondary}`}>{stat.label}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className={`text-xs ${textSecondary}`}>{stat.change}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
        <div className={`${cardBg} border ${cardBorder} rounded-xl card-hover p-6 xl:col-span-2`}>
          <div className="flex items-center justify-between mb-5">
            <h2 className={`font-bold ${textPrimary}`}>Последние задачи</h2>
            <button
              onClick={() => navigate('/projects')}
              className="text-[#4880ff] text-sm font-semibold hover:underline"
            >
              Все задачи
            </button>
          </div>
          {tasks.length === 0 ? (
            <p className={`text-sm ${textSecondary} py-8 text-center`}>
              Задач пока нет. Создайте проект и добавьте задачи.
            </p>
          ) : (
            <div className="space-y-1">
              {tasks.slice(0, 6).map((task) => {
                const st = statusStyles[task.status] || statusStyles[TaskStatus.NEW]
                return (
                  <div key={task.id} className={`flex items-center gap-4 py-3 border-b ${dividerColor} last:border-0`}>
                    <div className={`w-2 h-2 rounded-full ${st.dot} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium truncate ${textPrimary}`}>{task.name}</div>
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${st.color} ${st.bg} shrink-0`}>
                      {st.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className={`${cardBg} border ${cardBorder} rounded-xl card-hover p-6`}>
          <div className="flex items-center gap-2 mb-5">
            <span className="text-[#4880ff] text-lg">&#10022;</span>
            <h2 className={`font-bold ${textPrimary}`}>AI Аналитика рисков</h2>
          </div>
          {riskInsights.length === 0 ? (
            <p className={`text-sm ${textSecondary} py-8 text-center`}>
              Данные о рисках появятся после создания задач с дедлайнами.
            </p>
          ) : (
            <div className="space-y-3">
              {riskInsights.slice(0, 5).map((insight) => {
                const s = insightStyles[insight.type as keyof typeof insightStyles]
                return (
                  <div key={insight.id} className={`${s.bg} border ${s.border} rounded-lg p-3.5`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 shrink-0`} />
                      <p className={`text-sm leading-relaxed ${s.text}`}>{insight.message}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
