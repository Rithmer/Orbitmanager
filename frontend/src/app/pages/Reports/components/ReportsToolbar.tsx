import { RefreshCw } from 'lucide-react'
import { RefreshBadge } from '@/app/components/PageShell'
import type { ReportsToolbarProps } from '@/app/pages/Reports/types'

export function ReportsToolbar(props: ReportsToolbarProps) {
  const {
    isDark,
    textSecondary,
    selectedTeamId,
    selectedProjectId,
    teamOptions,
    projectOptions,
    filtersPending,
    isRefreshing,
    onChangeTeam,
    onChangeProject,
    onRefresh,
  } = props

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {filtersPending ? <div className={`px-3 py-2 rounded-lg text-xs font-semibold ${textSecondary}`}>Загрузка фильтров...</div> : null}
      <select
        value={selectedTeamId !== undefined ? String(selectedTeamId) : ''}
        onChange={(e) => onChangeTeam(e.target.value ? Number(e.target.value) : undefined)}
        className={`px-3 py-2 rounded-lg border text-sm max-w-[260px] ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
      >
        <option value="">Все доступные команды</option>
        {teamOptions.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
      </select>
      <select
        value={selectedProjectId !== undefined ? String(selectedProjectId) : ''}
        onChange={(e) => onChangeProject(e.target.value ? Number(e.target.value) : undefined)}
        className={`px-3 py-2 rounded-lg border text-sm max-w-[280px] ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
      >
        <option value="">Все доступные проекты</option>
        {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      {isRefreshing ? <RefreshBadge isRefreshing label="Обновляем отчёты" /> : null}
      <button onClick={onRefresh} disabled={isRefreshing} className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70">
        {isRefreshing ? <span className="h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {isRefreshing ? 'Обновление...' : 'Обновить'}
      </button>
    </div>
  )
}
