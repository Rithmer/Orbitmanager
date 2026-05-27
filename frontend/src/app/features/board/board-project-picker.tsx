import type { UseQueryResult } from '@tanstack/react-query'
import { AlertTriangle, BarChart2, Calendar, Search, Users } from 'lucide-react'
import { ErrorMessage } from '@/app/components/Modal'
import {
  PageCardGridSkeleton,
  PageRefreshOverlay,
  PageShell,
  PageToolbarSkeleton,
  RefreshBadge,
} from '@/app/components/PageShell'
import type { PaginatedResult } from '@/app/types'
import { PROJECT_STATUS_LABELS, ProjectStatus, RiskLevel } from '@/app/types'
import type { ProjectsListViewItem } from '@/app/features/projects'
import { BOARD_PROJECT_CARD_COLORS, getRiskBadgeClasses } from '@/app/features/board/board-view.constants'
import { formatBoardShortDate } from '@/app/features/board/board-page-formatters'

export function BoardPickerSkeleton({
  pageBg,
  description = 'Загрузка списка проектов...',
}: {
  pageBg: string
  description?: string
}) {
  return (
    <PageShell title="Задачи" description={description} className={pageBg}>
      <PageToolbarSkeleton />
      <PageCardGridSkeleton variant="project" count={6} />
    </PageShell>
  )
}

type BoardProjectPickerProps = {
  pageBg: string
  textPrimary: string
  textSecondary: string
  isDark: boolean
  projectPickerSearch: string
  onSearchChange: (value: string) => void
  pickerProjects: ProjectsListViewItem[]
  pickerProjectsAll: ProjectsListViewItem[]
  projectPickerQuery: UseQueryResult<PaginatedResult<ProjectsListViewItem>>
  onOpenProject: (id: number) => void
}

export function BoardProjectPicker({
  pageBg,
  textPrimary,
  textSecondary,
  isDark,
  projectPickerSearch,
  onSearchChange,
  pickerProjects,
  pickerProjectsAll,
  projectPickerQuery,
  onOpenProject,
}: BoardProjectPickerProps) {
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const inputBg = isDark
    ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]'
    : 'bg-white border-[#e8e8e8] text-[#202224]'

  const statusClassMap: Record<ProjectStatus, { bg: string; text: string }> = {
    [ProjectStatus.ACTIVE]: {
      bg: isDark ? 'bg-emerald-500/10' : 'bg-emerald-50',
      text: 'text-emerald-500',
    },
    [ProjectStatus.ON_HOLD]: {
      bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50',
      text: 'text-amber-500',
    },
    [ProjectStatus.COMPLETED]: {
      bg: isDark ? 'bg-[#4880ff]/10' : 'bg-blue-50',
      text: 'text-[#4880ff]',
    },
  }

  const isPickerRefreshing = projectPickerQuery.isFetching && !!projectPickerQuery.data
  const listError =
    projectPickerQuery.error instanceof Error ? projectPickerQuery.error.message : ''

  return (
    <PageShell
      title="Задачи"
      description="Выберите проект — откроется канбан и список задач, как на странице проекта."
      className={pageBg}
    >
      {listError && !projectPickerQuery.data ? (
        <>
          <div className="mb-6">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Поиск по названию, команде..."
                value={projectPickerSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full rounded-xl border px-9 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
              />
            </div>
          </div>
          <ErrorMessage message={listError} />
        </>
      ) : (
        <PageRefreshOverlay show={isPickerRefreshing} label="Обновление проектов">
          <div className="mb-6">
            <div className="relative">
              <Search className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${textSecondary}`} />
              <input
                type="text"
                placeholder="Поиск по названию, команде..."
                value={projectPickerSearch}
                onChange={(e) => onSearchChange(e.target.value)}
                className={`w-full rounded-xl border px-9 py-2.5 text-sm transition-colors focus:border-[#4880ff] focus:outline-none ${inputBg}`}
              />
            </div>
            <div className={`mt-2 flex items-center justify-between gap-3 text-xs ${textSecondary}`}>
              <div className="flex items-center gap-2">
                <span>
                  {pickerProjects.length}{' '}
                  {pickerProjects.length === 1 ? 'проект' : 'проектов'}
                  {projectPickerSearch.trim() && pickerProjectsAll.length !== pickerProjects.length
                    ? ` (из ${pickerProjectsAll.length})`
                    : null}
                </span>
                <RefreshBadge isRefreshing={isPickerRefreshing} label="Обновление..." />
              </div>
            </div>
          </div>

          {pickerProjectsAll.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border py-16 ${
                isDark ? 'border-[#313d4f] bg-[#273142]' : 'border-[#e8e8e8] bg-white'
              }`}
            >
              <p className={`text-sm font-semibold ${textSecondary}`}>Нет доступных проектов</p>
              <p className={`text-xs ${textSecondary}`}>
                Задачи откроются, когда у вас появится доступ хотя бы к одному проекту.
              </p>
            </div>
          ) : pickerProjects.length === 0 ? (
            <div
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border py-16 ${
                isDark ? 'border-[#313d4f] bg-[#273142]' : 'border-[#e8e8e8] bg-white'
              }`}
            >
              <Search className={`h-6 w-6 ${textSecondary}`} />
              <p className={`font-semibold ${textSecondary}`}>Ничего не найдено</p>
              <p className={`text-xs ${textSecondary}`}>Попробуйте изменить поисковый запрос</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 page-load-stagger">
              {pickerProjects.map((project, index) => {
                const colorIndex = index % BOARD_PROJECT_CARD_COLORS.length
                const statusStyle = statusClassMap[project.status]
                const isHighRisk = project.riskSummary.riskLevel === RiskLevel.HIGH
                const riskBadgeClasses = getRiskBadgeClasses(project.riskSummary.riskLevel)

                return (
                  <div
                    key={project.id}
                    role="button"
                    tabIndex={0}
                    className={`group card-hover cursor-pointer rounded-xl border border-[#e8e8e8] bg-white p-6 transition-all duration-200 dark:border-[#313d4f] dark:bg-[#273142] stagger-row`}
                    style={{ animationDelay: `${index * 80}ms` }}
                    onClick={() => onOpenProject(project.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onOpenProject(project.id)
                      }
                    }}
                  >
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${BOARD_PROJECT_CARD_COLORS[colorIndex]} text-base font-bold text-white`}
                        >
                          {project.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <h3
                            className={`truncate font-bold transition-colors ${textPrimary} group-hover:text-[#4880ff]`}
                          >
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
                                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${riskBadgeClasses.background} ${riskBadgeClasses.text}`}
                              >
                                <AlertTriangle className="h-3 w-3" />
                                {isHighRisk ? 'Высокий риск' : 'Средний риск'}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>

                    {project.description ? (
                      <p className={`mb-4 text-sm leading-relaxed ${textSecondary}`}>{project.description}</p>
                    ) : null}

                    <div className={`flex items-center justify-between border-t pt-4 ${dividerColor}`}>
                      <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                        <Users className="h-3.5 w-3.5" />
                        <span>{project.teamName}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                          <BarChart2 className="h-3.5 w-3.5" />
                          <span>{project.memberCount} уч.</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-xs ${textSecondary}`}>
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{formatBoardShortDate(project.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </PageRefreshOverlay>
      )}
    </PageShell>
  )
}
