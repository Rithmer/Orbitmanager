import { Modal } from '@/app/components/Modal'
import { TASK_STATUS_LABELS } from '@/app/types'
import { formatBoardDateTimeLabel } from '@/app/features/board/board-page-formatters'
import type { ProjectBoardTask } from '@/app/features/board/types'

export type BoardTaskDetailsModalProps = {
  open: boolean
  task: ProjectBoardTask | null
  textPrimary: string
  textSecondary: string
  isDark: boolean
  formatTaskAssigneesDetail: (task: ProjectBoardTask) => string
  onClose: () => void
  canEditTasks: boolean
  onEdit: (task: ProjectBoardTask) => void
}

export function BoardTaskDetailsModal({
  open,
  task,
  textPrimary,
  textSecondary,
  isDark,
  formatTaskAssigneesDetail,
  onClose,
  canEditTasks,
  onEdit,
}: BoardTaskDetailsModalProps) {
  return (
    <Modal open={open && task !== null} onClose={onClose} title="Подробности задачи" maxWidth="max-w-2xl">
      {task ? (
        <div className="space-y-4">
          <div>
            <h3 className={`text-lg font-bold ${textPrimary}`}>{task.name}</h3>
            <p className={`mt-1 text-sm ${textSecondary}`}>
              {task.description || 'Описание отсутствует'}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Дедлайн</p>
              <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>
                {formatBoardDateTimeLabel(task.deadline)}
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Статус</p>
              <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>
                {TASK_STATUS_LABELS[task.status]}
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Исполнители</p>
              <p
                className={`mt-1 text-sm font-semibold leading-relaxed whitespace-pre-line ${textPrimary}`}
              >
                {formatTaskAssigneesDetail(task)}
              </p>
            </div>
            <div className={`rounded-xl p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
              <p className={`text-xs uppercase tracking-wider ${textSecondary}`}>Сложность</p>
              <p className={`mt-1 text-sm font-semibold ${textPrimary}`}>{task.difficulty}/5</p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
            >
              Закрыть
            </button>
            {canEditTasks && (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="rounded-lg bg-[#4880ff] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
              >
                Редактировать
              </button>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  )
}
