import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../../components/Modal'
import { RISK_LEVEL_LABELS, TASK_STATUS_LABELS, TaskStatus } from '../../types'
import type { TaskRiskOutput } from '../../types'
import { formatBoardDateLabel, formatBoardDateTimeLabel } from './board-page-formatters'
import type { ProjectBoardMember, ProjectBoardTask } from './types'

type BoardTaskFormModalProps = {
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
          onChange={(value) => onTaskFormStatusChange(value as TaskStatus)}
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

type BoardTaskDetailsModalProps = {
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
                {TASK_STATUS_LABELS[task.status as TaskStatus]}
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

type BoardColumnTasksOverflowModalProps = {
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

type BoardRiskModalProps = {
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
