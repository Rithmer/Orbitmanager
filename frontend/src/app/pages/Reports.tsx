import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts'
import { CheckCircle2, Clock, AlertCircle, TrendingUp } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { tasksApi } from '../api/tasks'
import { projectsApi } from '../api/projects'
import type { Task, Project } from '../types'
import { TaskStatus } from '../types'

export function Reports() {
  const { isDark } = useTheme()

  const [tasks, setTasks] = useState<Task[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const gridColor = isDark ? '#313d4f' : '#f0f0f0'
  const axisColor = isDark ? '#94a3b8' : '#9ca3af'

  useEffect(() => {
    const load = async () => {
      try {
        const [tasksRes, projRes] = await Promise.all([
          tasksApi.list({ limit: 200 }),
          projectsApi.list({ limit: 100 }),
        ])
        setTasks(tasksRes.items)
        setProjects(projRes.items)
      } catch {
        /* skip */
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const doneTasks = tasks.filter((t) => t.status === TaskStatus.DONE).length
  const inProgressTasks = tasks.filter((t) => t.status === TaskStatus.IN_PROGRESS).length
  const newTasks = tasks.filter((t) => t.status === TaskStatus.NEW).length
  const overdueTasks = tasks.filter(
    (t) => new Date(t.deadline) < new Date() && t.status !== TaskStatus.DONE && t.status !== TaskStatus.CANCELLED,
  ).length
  const totalTasks = tasks.length
  const efficiency = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0

  const statusData = [
    { name: 'Выполнено', value: doneTasks, color: '#10b981' },
    { name: 'В процессе', value: inProgressTasks, color: '#f59e0b' },
    { name: 'К выполнению', value: newTasks, color: '#4880ff' },
    { name: 'Просрочено', value: overdueTasks, color: '#ef4444' },
  ].filter((d) => d.value > 0)

  const projectTaskData = projects.slice(0, 6).map((p) => {
    const pTasks = tasks.filter((t) => t.projectId === p.id)
    return {
      name: p.name.length > 10 ? p.name.slice(0, 10) + '...' : p.name,
      tasks: pTasks.length,
      completed: pTasks.filter((t) => t.status === TaskStatus.DONE).length,
    }
  })

  const difficultyData = [1, 2, 3, 4, 5].map((d) => ({
    week: `Ур. ${d}`,
    productivity: tasks.filter((t) => t.difficulty === d).length,
  }))

  const tooltipStyle = {
    backgroundColor: isDark ? '#273142' : '#fff',
    border: `1px solid ${isDark ? '#313d4f' : '#e8e8e8'}`,
    borderRadius: '8px',
    color: isDark ? '#f4f3f2' : '#202224',
    fontSize: '12px',
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
      iconBg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      label: 'Просрочено',
      value: String(overdueTasks),
      change: overdueTasks > 0 ? 'Требует внимания' : 'Отлично',
      icon: AlertCircle,
      iconBg: isDark ? 'bg-red-500/10' : 'bg-red-50',
      iconColor: 'text-red-500',
    },
    {
      label: 'Эффективность',
      value: `${efficiency}%`,
      change: `${projects.length} проектов`,
      icon: TrendingUp,
      iconBg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      iconColor: 'text-[#4880ff]',
    },
  ]

  if (loading) {
    return (
      <div className={`${pageBg} min-h-full flex items-center justify-center`}>
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className={`${pageBg} min-h-full p-8`}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${textPrimary}`}>Аналитика</h1>
          <p className={`mt-1 text-sm ${textSecondary}`}>Обзор производительности и прогресса</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold ${textPrimary}`}>{stat.value}</div>
                <div className={`text-sm ${textSecondary}`}>{stat.label}</div>
              </div>
            </div>
            <div className={`mt-3 text-xs ${textSecondary}`}>{stat.change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-6 xl:col-span-2`}>
          <h2 className={`font-bold mb-5 ${textPrimary}`}>Задачи по проектам</h2>
          {projectTaskData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={projectTaskData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: isDark ? 'rgba(72,128,255,0.05)' : 'rgba(72,128,255,0.04)' }} />
                <Bar dataKey="tasks" fill={isDark ? '#4880ff' : '#93c5fd'} name="Всего" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#4880ff" name="Выполнено" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных для отображения</p>
          )}
        </div>

        <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
          <h2 className={`font-bold mb-5 ${textPrimary}`}>Статус задач</h2>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend iconType="circle" iconSize={8} formatter={(value) => <span style={{ color: axisColor, fontSize: 12 }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className={`text-sm ${textSecondary} text-center py-10`}>Нет данных</p>
          )}
        </div>
      </div>

      <div className={`${cardBg} border ${cardBorder} rounded-xl p-6`}>
        <h2 className={`font-bold mb-5 ${textPrimary}`}>Распределение по сложности</h2>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={difficultyData}>
            <defs>
              <linearGradient id="prodGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4880ff" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#4880ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="week" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="productivity"
              stroke="#4880ff"
              strokeWidth={2.5}
              fill="url(#prodGradient)"
              name="Количество задач"
              dot={{ fill: '#4880ff', strokeWidth: 0, r: 4 }}
              activeDot={{ r: 6, fill: '#4880ff' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
