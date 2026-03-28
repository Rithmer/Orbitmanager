import { ErrorMessage, Modal, InputField, SelectField, SubmitButton } from '@/app/components/Modal'
import { ProjectStatus, PROJECT_STATUS_LABELS } from '@/app/types'
import { VISIBLE_PROJECT_STATUSES } from '@/app/pages/Projects/constants'
import type { ProjectsEditProjectModalProps } from '@/app/pages/Projects/types'

export function ProjectsEditProjectModal({ vm }: ProjectsEditProjectModalProps) {
  const { projectForm, projectActions, shell } = vm
  const {
    showEditModal,
    setShowEditModal,
    formError,
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formStatus,
    setFormStatus,
    formLoading,
  } = projectForm
  const { handleEditProject } = projectActions
  const { theme } = shell

  return (
    <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать проект">
      <ErrorMessage message={formError} />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleEditProject()
        }}
        className="space-y-4"
      >
        <InputField
          label="Название"
          value={formName}
          onChange={setFormName}
          required
          hint="Название будет видно в списке проектов."
        />
        <InputField
          label="Описание"
          value={formDescription}
          onChange={setFormDescription}
          hint="Краткое описание проекта."
        />
        <SelectField
          label="Статус"
          value={formStatus}
          onChange={(value) => setFormStatus(value as ProjectStatus)}
          options={VISIBLE_PROJECT_STATUSES.map((value) => ({
            value,
            label: PROJECT_STATUS_LABELS[value],
          }))}
        />
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className={`px-4 py-2 text-sm font-semibold ${theme.textSecondary}`}
          >
            Отмена
          </button>
          <SubmitButton loading={formLoading} className="min-w-28">
            Сохранить
          </SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
