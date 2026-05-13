import { Search } from 'lucide-react'

export function ProjectsEmptyState({
  isDark,
  textSecondary,
  searchTerm,
}: {
  isDark: boolean
  textSecondary: string
  searchTerm: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-[#e8e8e8] py-16 dark:border-[#313d4f] ${isDark ? 'bg-[#273142]' : 'bg-white'}`}>
      <Search className={`h-6 w-6 ${textSecondary}`} />
      <p className={`font-semibold ${textSecondary}`}>{searchTerm ? 'Ничего не найдено' : 'Проектов пока нет'}</p>
      <p className={`text-xs ${textSecondary}`}>{searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Создайте первый проект'}</p>
    </div>
  )
}
