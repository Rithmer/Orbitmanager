import { Plus } from 'lucide-react'
import type { TeamsPageHeaderProps } from '@/app/pages/Teams/types'

export function TeamsPageHeader({ model }: TeamsPageHeaderProps) {
  const { ui, data, handlers } = model
  const { textPrimary, textSecondary } = ui

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Команды</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>{data.teams.length} команд</p>
      </div>
      <button
        onClick={handlers.openCreateModal}
        className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 self-start sm:self-auto btn-fizzy"
      >
        <Plus className="w-4 h-4" />
        Новая команда
      </button>
    </div>
  )
}
