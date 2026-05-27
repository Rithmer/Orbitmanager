import { Filter } from 'lucide-react'
import type { CalendarFiltersProps } from '@/app/pages/Calendar/types'

export function CalendarFilters({ ui, filterType, filterButtons, onChange }: CalendarFiltersProps) {
  const { isDark, textSecondary } = ui
  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap page-load-stagger">
      <Filter className={`w-4 h-4 ${textSecondary}`} />
      {filterButtons.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filterType === f.key
              ? 'bg-[#4880ff] text-white'
              : isDark
                ? 'bg-[#273142] text-[#94a3b8] hover:text-white'
                : 'bg-white text-gray-500 hover:text-gray-700 border border-gray-200'
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  )
}
