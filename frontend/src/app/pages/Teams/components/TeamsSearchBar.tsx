import { Search } from 'lucide-react'
import type { TeamsSearchBarProps } from '@/app/pages/Teams/types'

export function TeamsSearchBar({ model }: TeamsSearchBarProps) {
  const { ui, search } = model
  const { textSecondary, inputBg } = ui

  return (
    <div className="relative mb-6">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
      <input
        type="text"
        placeholder="Поиск по командам и участникам..."
        value={search.query}
        onChange={(e) => search.setQuery(e.target.value)}
        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg}`}
      />
    </div>
  )
}
