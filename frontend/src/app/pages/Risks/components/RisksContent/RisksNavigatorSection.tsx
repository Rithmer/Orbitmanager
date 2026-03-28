import type { RisksNavigatorSectionProps } from '@/app/pages/Risks/types'

export function RisksNavigatorSection({ ports }: RisksNavigatorSectionProps) {
  const { theme, selection, data } = ports
  const {
    cardBg,
    cardBorder,
    textSecondary,
    divider,
    isDark,
  } = theme
  const {
    selectedTeamId,
    selectTeam: onSelectTeam,
    selectProject: onSelectProject,
    goBackToTeams: onBackToTeams,
  } = selection
  const { sortedTeams, sortedProjects, effectiveProjectId } = data

  return (
    <div className={`${cardBg} border ${cardBorder} xl:h-[640px] rounded-xl p-4`}>
      <h3 className="text-base font-semibold mb-1">{selectedTeamId === undefined ? 'Команды' : 'Проекты'}</h3>
      <p className={`text-xs ${textSecondary} mb-3`}>
        {selectedTeamId === undefined ? 'Выберите команду для перехода к списку проектов.' : 'Выберите проект выбранной команды.'}
      </p>
      {selectedTeamId === undefined ? (
        sortedTeams.length > 0 ? (
          <div className="space-y-2 xl:max-h-[480px] xl:overflow-y-auto pr-1">
            <div className={`h-px ${divider}`} />
            {sortedTeams.map((team) => (
              <button
                key={team.id}
                type="button"
                onClick={() => onSelectTeam(team.id)}
                className={`w-full rounded-xl border ${cardBorder} px-3 py-2 text-left text-sm hover:border-[#4880ff] transition-colors`}
              >
                {team.name}
              </button>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${textSecondary}`}>Нет доступных команд.</p>
        )
      ) : (
        <div className="space-y-3 xl:max-h-[500px] xl:overflow-y-auto pr-1">
          <button
            type="button"
            onClick={onBackToTeams}
            className={`text-xs font-semibold ${textSecondary} hover:text-[#4880ff] transition-colors`}
          >
            ← Назад к списку команд
          </button>
          <div className={`h-px ${divider}`} />
          {sortedProjects.length > 0 ? (
            sortedProjects.map((project) => {
              const active = effectiveProjectId === project.id
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                    active ? 'border-[#4880ff] bg-[#4880ff]/10' : `${cardBorder} hover:border-[#4880ff]`
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full border ${
                        active ? 'bg-[#4880ff] border-[#4880ff]' : isDark ? 'border-[#64748b]' : 'border-[#cbd5e1]'
                      }`}
                    />
                    {project.name}
                  </span>
                </button>
              )
            })
          ) : (
            <p className={`text-sm ${textSecondary}`}>Нет доступных проектов для команды.</p>
          )}
        </div>
      )}
    </div>
  )
}
