import {
  AlertTriangle,
  BarChart2,
  Calendar as CalendarIcon,
  Edit3,
  LoaderCircle,
  MoreVertical,
  Trash2,
  Users,
} from 'lucide-react'
import { PROJECT_STATUS_LABELS, RiskLevel } from '@/app/types'
import type { ProjectsProjectCardProps } from '@/app/pages/Projects/types'

function formatShortDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}

export function ProjectsProjectCard({
  cardColor,
  dividerColor,
  isDark,
  isDeletePending,
  isMenuOpen,
  moreIconColor,
  project,
  projectIndex,
  statusClassMap,
  textPrimary,
  textSecondary,
  onCloseMenu,
  onDelete,
  onNavigateToBoard,
  onOpenEdit,
  onOpenMembers,
  onToggleMenu,
}: ProjectsProjectCardProps) {
  const statusStyle = statusClassMap[project.status]
  const isHighRisk = project.riskSummary.riskLevel === RiskLevel.HIGH

  return (
    <div
      className="group card-hover cursor-pointer rounded-xl border border-[#e8e8e8] bg-white p-6 transition-all duration-200 dark:border-[#313d4f] dark:bg-[#273142] stagger-row"
      style={{ animationDelay: `${projectIndex * 80}ms` }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3" onClick={onNavigateToBoard}>
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cardColor} text-base font-bold text-white`}
          >
            {project.name.charAt(0)}
          </div>
          <div className="min-w-0">
            <h3 className={`truncate font-bold ${textPrimary} group-hover:text-[#4880ff] transition-colors`}>
              {project.name}
            </h3>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle.bg} ${statusStyle.text}`}
              >
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </span>
              {project.riskSummary.riskLevel !== RiskLevel.LOW ? (
                <span
                  className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    isHighRisk ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                  }`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {isHighRisk ? 'Высокий риск' : 'Средний риск'}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className={`relative ${isMenuOpen ? 'z-[70]' : ''}`}>
          <button
            type="button"
            data-project-menu-button-id={project.id}
            onClick={(event) => {
              event.stopPropagation()
              onToggleMenu()
            }}
            className={`rounded p-1 transition-colors ${moreIconColor}`}
          >
            <MoreVertical className="h-4 w-4" />
          </button>
          {isMenuOpen ? (
            <div
              data-project-menu-id={project.id}
              className={`dropdown-enter absolute right-0 top-8 z-[80] w-52 overflow-hidden rounded-xl border shadow-xl ${
                isDark ? 'border-[#313d4f] bg-[#273142]' : 'border-[#e8e8e8] bg-white'
              }`}
            >
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenMembers()
                  onCloseMenu()
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${
                  isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                }`}
              >
                <Users className="h-4 w-4" />
                Участники
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onOpenEdit()
                  onCloseMenu()
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm ${textPrimary} ${
                  isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                Редактировать
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation()
                  onDelete()
                }}
                disabled={isDeletePending}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
                }`}
              >
                {isDeletePending ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {isDeletePending ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {project.description ? (
        <p
          className={`mb-4 text-sm leading-relaxed break-words line-clamp-3 ${textSecondary}`}
          onClick={onNavigateToBoard}
          title={project.description}
        >
          {project.description}
        </p>
      ) : null}

      <div className={`flex items-center justify-between border-t pt-4 ${dividerColor}`} onClick={onNavigateToBoard}>
        <div className={`flex items-center gap-1.5 text-xs ${textSecondary} min-w-0`}>
          <Users className="h-3.5 w-3.5" />
          <span className="truncate" title={project.teamName}>
            {project.teamName}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
            <BarChart2 className="h-3.5 w-3.5" />
            <span>{project.memberCount} уч.</span>
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatShortDate(project.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
