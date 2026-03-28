import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '@/app/components/Modal'
import { TASK_STATUS_LABELS, TaskStatus } from '@/app/types'
import type { ProjectBoardMember } from '@/app/features/board/types'

function isTaskStatus(value: string): value is TaskStatus {
  return Object.values(TaskStatus).includes(value as TaskStatus)
}

export type BoardTaskFormModalProps = {
  open: boolean
  onClose: () => void
  title: string
  taskFormError: string
  taskFormName: string
  onTaskFormNameChange: (v: string) => void
  taskFormDescription: string
  onTaskFormDescriptionChange: (v: string) => void
  taskFormDeadline: string
  onTaskFormDeadlineChange: (v: string) => void
  taskFormDifficulty: string
  onTaskFormDifficultyChange: (v: string) => void
  taskFormAssigneeIds: number[]
  onSetTaskFormAssigneeIds: (updater: (current: number[]) => number[]) => void
  taskFormStatus: TaskStatus
  onTaskFormStatusChange: (v: TaskStatus) => void
  projectMembers: ProjectBoardMember[]
  isDark: boolean
  textSecondary: string
  onSubmit: () => void
  createOrUpdatePending: boolean
  isEditing: boolean
}

export function BoardTaskFormModal({
  open,
  onClose,
  title,
  taskFormError,
  taskFormName,
  onTaskFormNameChange,
  taskFormDescription,
  onTaskFormDescriptionChange,
  taskFormDeadline,
  onTaskFormDeadlineChange,
  taskFormDifficulty,
  onTaskFormDifficultyChange,
  taskFormAssigneeIds,
  onSetTaskFormAssigneeIds,
  taskFormStatus,
  onTaskFormStatusChange,
  projectMembers,
  isDark,
  textSecondary,
  onSubmit,
  createOrUpdatePending,
  isEditing,
}: BoardTaskFormModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-xl">
      <ErrorMessage message={taskFormError} />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void onSubmit()
        }}
        className="space-y-4"
      >
        <InputField
          label="Название"
          value={taskFormName}
          onChange={onTaskFormNameChange}
          required
          placeholder="Название задачи"
        />
        <InputField
          label="Описание"
          value={taskFormDescription}
          onChange={onTaskFormDescriptionChange}
          placeholder="Подробности задачи"
        />
        <InputField
          label="Дедлайн"
          value={taskFormDeadline}
          onChange={onTaskFormDeadlineChange}
          type="date"
          required
        />
        <SelectField
          label="Сложность"
          value={taskFormDifficulty}
          onChange={onTaskFormDifficultyChange}
          options={[
            { value: '1', label: '1' },
            { value: '2', label: '2' },
            { value: '3', label: '3' },
            { value: '4', label: '4' },
            { value: '5', label: '5' },
          ]}
        />
        <div>
          <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Исполнители</label>
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => onSetTaskFormAssigneeIds(() => [])}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                taskFormAssigneeIds.length === 0
                  ? isDark
                    ? 'border-[#4880ff] bg-[#4880ff]/15 text-[#4880ff]'
                    : 'border-[#4880ff] bg-blue-50 text-[#4880ff]'
                  : isDark
                    ? 'border-[#313d4f] bg-[#1c2534] text-[#94a3b8] hover:bg-[#273142]'
                    : 'border-gray-200 bg-white text-[#737373] hover:bg-gray-50'
              }`}
            >
              Не назначено
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {projectMembers.map((member) => {
                const checked = taskFormAssigneeIds.includes(member.userId)
                return (
                  <label
                    key={member.userId}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                      isDark
                        ? checked
                          ? 'border-[#4880ff] bg-[#4880ff]/10 text-[#f4f3f2]'
                          : 'border-[#313d4f] bg-[#1c2534] text-[#94a3b8] hover:bg-[#273142]'
                        : checked
                          ? 'border-[#4880ff] bg-blue-50 text-[#202224]'
                          : 'border-gray-200 bg-white text-[#737373] hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        onSetTaskFormAssigneeIds((current) =>
                          current.includes(member.userId)
                            ? current.filter((id) => id !== member.userId)
                            : [...current, member.userId],
                        )
                      }}
                    />
                    <span className="truncate">{member.user.fullName}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
        <SelectField
          label="Статус"
          value={taskFormStatus}
          onChange={(value) => {
            if (isTaskStatus(value)) {
              onTaskFormStatusChange(value)
            }
          }}
          options={Object.values(TaskStatus).map((status) => ({
            value: status,
            label: TASK_STATUS_LABELS[status],
          }))}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
          >
            Отмена
          </button>
          <SubmitButton loading={createOrUpdatePending}>
            {isEditing ? 'Сохранить' : 'Создать'}
          </SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
