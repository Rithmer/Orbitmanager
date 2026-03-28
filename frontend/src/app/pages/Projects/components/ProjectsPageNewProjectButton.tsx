import { Plus } from 'lucide-react'
import type { ProjectsPageNewProjectButtonProps } from '@/app/pages/Projects/types'

export function ProjectsPageNewProjectButton({ onClick }: ProjectsPageNewProjectButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#3a6fe0] btn-fizzy"
    >
      <Plus className="h-4 w-4" />
      Новый проект
    </button>
  )
}
