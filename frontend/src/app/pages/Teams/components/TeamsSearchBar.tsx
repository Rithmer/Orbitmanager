import { Search } from 'lucide-react'

type TeamsSearchBarProps = {
  value: string
  onChange: (value: string) => void
  textSecondary: string
  inputBg: string
}

export function TeamsSearchBar({ value, onChange, textSecondary, inputBg }: TeamsSearchBarProps) {
  return (
    <div className="relative mb-6">
      <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
      <input
        type="text"
        placeholder="Поиск по командам и участникам..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg}`}
      />
    </div>
  )
}
