import { Modal } from '@/app/components/Modal'
import { formatBoardDateLabel } from '@/app/features/board/board-page-formatters'
import type { ProjectBoardTask } from '@/app/features/board/types'

export type BoardColumnTasksOverflowModalProps = {
  modal: { title: string; tasks: ProjectBoardTask[] } | null
  onClose: () => void
  textPrimary: string
  textSecondary: string
  isDark: boolean
  formatTaskAssigneesShort: (task: ProjectBoardTask) => string
  onSelectTask: (task: ProjectBoardTask) => void
}

export function BoardColumnTasksOverflowModal({
  modal,
  onClose,
  textPrimary,
  textSecondary,
  isDark,
  formatTaskAssigneesShort,
  onSelectTask,
}: BoardColumnTasksOverflowModalProps) {
  return (
    <Modal
      open={modal !== null}
      onClose={onClose}
      title={modal ? `${modal.title} · все задачи` : ''}
      maxWidth="max-w-lg"
    >
      {modal ? (
        <div className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
          {modal.tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onSelectTask(task)
                onClose()
              }}
              className={`flex w-full flex-col gap-0.5 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${
                isDark ? 'border-[#313d4f] hover:bg-[#1c2534]' : 'border-gray-100 hover:bg-gray-50'
              }`}
            >
              <span className={`font-semibold ${textPrimary}`}>{task.name}</span>
              <span className={`text-xs ${textSecondary}`}>
                {formatBoardDateLabel(task.deadline)} · {formatTaskAssigneesShort(task)}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </Modal>
  )
}
