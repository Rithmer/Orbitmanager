import { ErrorMessage, Modal, InputField, SelectField, SubmitButton } from '@/app/components/Modal'
import { ProjectStatus, PROJECT_STATUS_LABELS } from '@/app/types'
import { VISIBLE_PROJECT_STATUSES } from '@/app/pages/Projects/constants'
import type { ProjectsCreateProjectModalProps } from '@/app/pages/Projects/types'

export function ProjectsCreateProjectModal({ vm }: ProjectsCreateProjectModalProps) {
  const { projectForm, projectActions, list, shell } = vm
  const {
    showCreateModal,
    setShowCreateModal,
    formError,
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formTeamId,
    setFormTeamId,
    formStatus,
    setFormStatus,
    formLoading,
  } = projectForm
  const { handleCreateProject } = projectActions
  const { teamsOptionsQuery } = list
  const { theme } = shell

  return (
    <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новый проект">
      <ErrorMessage message={formError} />
      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleCreateProject()
        }}
        className="space-y-4"
      >
        <InputField
          label="Название"
          value={formName}
          onChange={setFormName}
          required
          placeholder="Название проекта"
          hint="Название будет видно в списке проектов."
        />
        <InputField
          label="Описание"
          value={formDescription}
          onChange={setFormDescription}
          placeholder="Описание"
        />
        <SelectField
          label="Команда"
          value={formTeamId}
          onChange={setFormTeamId}
          required
          disabled={teamsOptionsQuery.isPending && !teamsOptionsQuery.data}
          hint={
            teamsOptionsQuery.error instanceof Error && !teamsOptionsQuery.data
              ? teamsOptionsQuery.error.message
              : teamsOptionsQuery.isPending && !teamsOptionsQuery.data
                ? 'Загружаем список команд...'
                : 'Проект будет связан с одной командой.'
          }
          options={[
            {
              value: '',
              label:
                teamsOptionsQuery.isPending && !teamsOptionsQuery.data
                  ? 'Загрузка команд...'
                  : teamsOptionsQuery.data?.items.length
                    ? 'Выберите команду...'
                    : 'Команд нет',
            },
            ...(teamsOptionsQuery.data?.items ?? []).map((team) => ({
              value: String(team.id),
              label: team.name,
            })),
          ]}
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
            onClick={() => setShowCreateModal(false)}
            className={`px-4 py-2 text-sm font-semibold ${theme.textSecondary}`}
          >
            Отмена
          </button>
          <SubmitButton loading={formLoading} className="min-w-28">
            Создать
          </SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
