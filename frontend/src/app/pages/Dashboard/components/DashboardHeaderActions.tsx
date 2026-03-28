import { Plus } from 'lucide-react'
import { RefreshBadge } from '@/app/components/PageShell'

type DashboardHeaderActionsProps = {
  isRefreshing: boolean
  projectsAccessLoading: boolean
  canUseProjectsSection: boolean
  onCreateProject: () => void
}

export function DashboardHeaderActions({
  isRefreshing,
  projectsAccessLoading,
  canUseProjectsSection,
  onCreateProject,
}: DashboardHeaderActionsProps) {
  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      {isRefreshing ? <RefreshBadge isRefreshing label="Сводка обновляется" /> : null}
      {!projectsAccessLoading && canUseProjectsSection ? (
        <button
          onClick={onCreateProject}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150 btn-fizzy"
        >
          <Plus className="w-4 h-4" />
          Создать проект
        </button>
      ) : null}
    </div>
  )
}
