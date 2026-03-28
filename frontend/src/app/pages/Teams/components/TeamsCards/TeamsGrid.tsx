import { Search } from 'lucide-react'
import { TeamCard } from './TeamCard'
import type { TeamsGridProps } from '@/app/pages/Teams/types'

export function TeamsGrid({
  teams,
  teamMembers,
  cardBg,
  cardBorder,
  textSecondary,
  isDark,
  renderCard,
  searchQuery,
}: TeamsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 page-load-stagger">
      {teams.length > 0 ? teams.map((team, idx) => renderCard(team, teamMembers[team.id] || [], idx)) : (
        <div className={`col-span-2 flex flex-col items-center justify-center py-16 gap-3 ${cardBg} border ${cardBorder} rounded-xl`}>
          <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
            <Search className={`w-6 h-6 ${textSecondary}`} />
          </div>
          <p className={`font-semibold ${textSecondary}`}>{searchQuery ? 'Ничего не найдено' : 'Команд пока нет'}</p>
        </div>
      )}
    </div>
  )
}

export { TeamCard }
