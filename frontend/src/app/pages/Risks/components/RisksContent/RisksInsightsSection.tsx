import { ChevronRight, RefreshCw } from 'lucide-react'
import { formatFitScore, formatImpactLabel, getCoordinationRiskExplanation } from '@/app/pages/Risks/helpers'
import { RISKS_PAGE_CONSTANTS } from '@/app/pages/Risks/constants'
import type { RisksInsightsSectionProps } from '@/app/pages/Risks/types'

export function RisksInsightsSection({
  selectedTeamId,
  selectedCard,
  sortedTaskInsights,
  selectedTask,
  topRecommendedAssignees,
  cardBg,
  cardBorder,
  panelMuted,
  textSecondary,
  divider,
  expandedAlternativesByTaskId,
  llmRecommendation,
  isLoadingLlmRec,
  onRefreshRecommendation,
  onSelectTask,
  onToggleAlternatives,
}: RisksInsightsSectionProps) {
  return (
    <div className={`xl:col-span-2 ${cardBg} border ${cardBorder} xl:h-[640px] rounded-xl p-4`}>
      <h3 className="text-base font-semibold mb-1">Задачи и аналитика ИИ</h3>
      <p className={`text-xs ${textSecondary} mb-3`}>
        Задачи отсортированы от наименьшего процента успеха к наибольшему.
      </p>
      {selectedTeamId === undefined ? (
        <p className={`text-sm ${textSecondary}`}>{RISKS_PAGE_CONSTANTS.selectTeamMessage}</p>
      ) : !selectedCard ? (
        <p className={`text-sm ${textSecondary}`}>{RISKS_PAGE_CONSTANTS.selectProjectMessage}</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 h-full">
          <div className="pr-0 lg:pr-5 space-y-3 min-h-0">
            <h4 className="text-sm font-semibold">Задачи</h4>
            <div className={`h-px ${divider}`} />
            {sortedTaskInsights.length > 0 ? (
              <div className="space-y-2 max-h-[510px] overflow-y-auto pr-1">
                {sortedTaskInsights.map((task) => {
                  const active = selectedTask?.taskId === task.taskId
                  return (
                    <button
                      key={task.taskId}
                      type="button"
                      onClick={() => onSelectTask(task.taskId)}
                      className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                        active ? 'border-[#4880ff] bg-[#4880ff]/10' : `${cardBorder} hover:border-[#4880ff]`
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium truncate">{task.taskName}</span>
                        <span className="text-xs font-semibold text-[#4880ff] whitespace-nowrap">
                          {task.taskSuccessProbability}%
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className={`text-sm ${textSecondary}`}>{RISKS_PAGE_CONSTANTS.noTaskMessage}</p>
            )}
          </div>
          <div className="mt-5 lg:mt-0 lg:pl-5 lg:border-l border-transparent lg:border-[#e5e7eb] dark:lg:border-[#313d4f] space-y-3 min-h-0">
            <h4 className="text-sm font-semibold">Аналитика ИИ</h4>
            <div className={`h-px ${divider}`} />
            <div className="xl:max-h-[530px] xl:overflow-y-auto pr-1">
              {selectedTask ? (
                selectedTask.assigneeBreakdown.length > 0 ? (
                  <div className="space-y-3">
                    <div className={`rounded-xl ${panelMuted} p-3`}>
                      <p className="text-sm font-semibold">{selectedTask.assigneeBreakdown[0].userName}</p>
                      <p className={`text-xs mt-1 ${textSecondary}`}>Вероятность успеха задачи: {selectedTask.taskSuccessProbability}%.</p>
                      <p className={`text-xs mt-1 ${textSecondary}`}>Риск координации: {selectedTask.coordinationPenalty}%.</p>
                      <p className={`text-xs mt-1 ${textSecondary}`}>{getCoordinationRiskExplanation(selectedTask.coordinationPenalty)}</p>
                    </div>
                    <div className={`rounded-xl ${panelMuted} p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs uppercase tracking-wider font-semibold">Рекомендация ИИ</p>
                        <button
                          type="button"
                          onClick={onRefreshRecommendation}
                          disabled={isLoadingLlmRec}
                          className={`text-[#4880ff] disabled:opacity-40 transition-opacity`}
                          title="Перегенерировать"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingLlmRec ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      {isLoadingLlmRec
                        ? <p className={`text-xs ${textSecondary} animate-pulse`}>Анализирую задачу...</p>
                        : <p className={`text-xs ${textSecondary}`}>{llmRecommendation ?? '—'}</p>
                      }
                    </div>
                    <div className={`rounded-xl ${panelMuted} p-3`}>
                      {selectedTask.recommendedAssignees.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => onToggleAlternatives(selectedTask.taskId)}
                          className="w-full flex items-center justify-between text-sm"
                        >
                          <span>Есть свободные альтернативы: <span className="font-semibold">{selectedTask.recommendedAssignees.length}</span></span>
                          <ChevronRight className={`h-4 w-4 transition-transform ${expandedAlternativesByTaskId[selectedTask.taskId] ? 'rotate-90' : ''}`} />
                        </button>
                      ) : <p className="text-sm">Свободных альтернативных исполнителей не найдено.</p>}
                      {selectedTask.recommendedAssignees.length > 0 ? (
                        <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expandedAlternativesByTaskId[selectedTask.taskId] ? '340px' : '0px' }}>
                          <div className={`mt-3 space-y-2 ${selectedTask.recommendedAssignees.length >= 4 ? 'max-h-56 overflow-y-auto pr-1' : ''}`}>
                            {selectedTask.recommendedAssignees.map((assignee, index) => (
                              <div key={`${selectedTask.taskId}-${assignee.userId}`} className={`rounded-lg border ${cardBorder} px-3 py-2`}>
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-sm font-semibold truncate">{index + 1}. {assignee.fullName}</span>
                                  <span className="text-xs text-[#4880ff] font-semibold">{formatFitScore(assignee.fitScore)}</span>
                                </div>
                                <p className={`text-[11px] mt-1 ${textSecondary}`}>Релевантность кандидата</p>
                                <p className={`text-xs mt-1 ${textSecondary}`}>{assignee.role} - {assignee.profession}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                    {selectedTask.assigneeBreakdown.map((assignee) => (
                      <div key={`${selectedTask.taskId}-${assignee.userId}`} className={`rounded-xl ${panelMuted} p-3`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium truncate">{assignee.userName}</span>
                          <span className={`text-xs ${formatImpactLabel(assignee.impactScore).className}`}>
                            {formatImpactLabel(assignee.impactScore).label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Исполнитель не назначен</p>
                    <div className={`rounded-xl ${panelMuted} p-3`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs uppercase tracking-wider font-semibold">Рекомендация ИИ</p>
                        <button
                          type="button"
                          onClick={onRefreshRecommendation}
                          disabled={isLoadingLlmRec}
                          className={`text-[#4880ff] disabled:opacity-40 transition-opacity`}
                          title="Перегенерировать"
                        >
                          <RefreshCw className={`h-3 w-3 ${isLoadingLlmRec ? 'animate-spin' : ''}`} />
                        </button>
                      </div>
                      {isLoadingLlmRec
                        ? <p className={`text-xs ${textSecondary} animate-pulse`}>Анализирую задачу...</p>
                        : <p className={`text-xs ${textSecondary}`}>{llmRecommendation ?? '—'}</p>
                      }
                    </div>
                    <div className={`rounded-xl ${panelMuted} p-3`}>
                      <button type="button" onClick={() => onToggleAlternatives(selectedTask.taskId)} className="w-full flex items-center justify-between text-sm">
                        <span>Есть свободные альтернативы: <span className="font-semibold">{selectedTask.recommendedAssignees.length}</span></span>
                        <ChevronRight className={`h-4 w-4 transition-transform ${expandedAlternativesByTaskId[selectedTask.taskId] ? 'rotate-90' : ''}`} />
                      </button>
                      <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: expandedAlternativesByTaskId[selectedTask.taskId] ? '360px' : '0px' }}>
                        <div className={`mt-3 space-y-2 ${selectedTask.recommendedAssignees.length >= 4 ? 'max-h-56 overflow-y-auto pr-1' : ''}`}>
                          {topRecommendedAssignees.map((assignee, index) => (
                            <div key={`${selectedTask.taskId}-${assignee.userId}`} className={`rounded-lg border ${cardBorder} px-3 py-2`}>
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold truncate">{index + 1}. {assignee.fullName}</span>
                                <span className="text-xs text-[#4880ff] font-semibold">{formatFitScore(assignee.fitScore)}</span>
                              </div>
                              <p className={`text-[11px] mt-1 ${textSecondary}`}>Релевантность кандидата</p>
                              <p className={`text-xs mt-1 ${textSecondary}`}>{assignee.role} - {assignee.profession}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {topRecommendedAssignees.length > 0 ? (
                      <div className={`rounded-xl ${panelMuted} p-3`}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium truncate">{topRecommendedAssignees[0].fullName}</span>
                          <span className={`text-xs ${formatImpactLabel(topRecommendedAssignees[0].fitScore).className}`}>
                            {formatImpactLabel(topRecommendedAssignees[0].fitScore).label}
                          </span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              ) : (
                <p className={`text-sm ${textSecondary}`}>{RISKS_PAGE_CONSTANTS.selectTaskMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
