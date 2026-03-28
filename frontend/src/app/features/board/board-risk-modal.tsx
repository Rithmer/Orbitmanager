import { Modal } from '@/app/components/Modal'
import { RISK_LEVEL_LABELS } from '@/app/types'
import type { TaskRiskOutput } from '@/app/types'
import { formatBoardDateLabel } from '@/app/features/board/board-page-formatters'
import type { ProjectBoardTask } from '@/app/features/board/types'

export type BoardRiskModalProps = {
  open: boolean
  selected: { task: ProjectBoardTask; risk: TaskRiskOutput } | null
  textPrimary: string
  textSecondary: string
  isDark: boolean
  onClose: () => void
}

export function BoardRiskModal({
  open,
  selected,
  textPrimary,
  textSecondary,
  isDark,
  onClose,
}: BoardRiskModalProps) {
  return (
    <Modal open={open && selected !== null} onClose={onClose} title="Оценка рисков" maxWidth="max-w-2xl">
      {selected ? (
        <div className="space-y-4">
          <div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>{selected.task.name}</h3>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              {selected.task.description || 'Описание отсутствует'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Уровень</p>
              <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>
                {RISK_LEVEL_LABELS[selected.risk.riskLevel]}
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Вероятность</p>
              <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>
                {Math.round(selected.risk.delayProbability * 100)}%
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Прогноз</p>
              <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>
                {formatBoardDateLabel(selected.risk.predictedCompletionDate)}
              </p>
            </div>
          </div>
          <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
            <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Рекомендация</p>
            <p className={`mt-1 text-sm ${textPrimary}`}>{selected.risk.recommendation}</p>
          </div>
          {(selected.risk.riskFactors?.length ?? 0) > 0 && (
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Факторы риска</p>
              <ul className={`mt-2 space-y-2 text-sm ${textPrimary}`}>
                {(selected.risk.riskFactors ?? []).map((factor) => (
                  <li key={factor} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4880ff]" />
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-[#4880ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
            >
              Закрыть
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
