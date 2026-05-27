import type { ReactNode } from 'react'
import { Search } from 'lucide-react'
import { PROJECT_STATUS_LABELS, type ProjectStatus } from '@/app/types'
import { VISIBLE_PROJECT_STATUSES } from '@/app/pages/Projects/constants'

export function ProjectsToolbar({
  searchInput,
  onSearchChange,
  filterTeamId,
  onFilterTeamChange,
  filterStatus,
  onFilterStatusChange,
  teams,
  inputBg,
  textSecondary,
  totalProjects,
  isRefreshing,
  refreshNode,
}: {
  searchInput: string
  onSearchChange: (value: string) => void
  filterTeamId: number | null
  onFilterTeamChange: (value: number | null) => void
  filterStatus: ProjectStatus | ''
  onFilterStatusChange: (value: ProjectStatus | '') => void
  teams: Array<{ id: number; name: string }>
  inputBg: string
  textSecondary: string
  totalProjects: number
  isRefreshing: boolean
  refreshNode?: ReactNode
}) {
  return (
    <div className="mb-6">
      <div className="relative">
        <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`} />
        <input type="text" placeholder="Поиск проектов..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className={`w-full rounded-xl border px-9 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`} />
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <select value={filterTeamId ?? ''} onChange={(e) => onFilterTeamChange(e.target.value ? Number(e.target.value) : null)} className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}>
          <option value="">Все команды</option>
          {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => onFilterStatusChange((e.target.value || '') as ProjectStatus | '')} className={`rounded-xl border px-3 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}>
          <option value="">Все статусы</option>
          {VISIBLE_PROJECT_STATUSES.map((value) => <option key={value} value={value}>{PROJECT_STATUS_LABELS[value]}</option>)}
        </select>
      </div>
      <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
        <span>{totalProjects} {totalProjects === 1 ? 'проект' : 'проектов'}</span>
        <div className="flex items-center gap-2">{refreshNode}{isRefreshing ? <span>Обновление списка...</span> : null}</div>
      </div>
    </div>
  )
}
