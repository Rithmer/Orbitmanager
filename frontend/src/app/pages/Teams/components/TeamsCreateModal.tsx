import { ErrorMessage, InputField, Modal, SubmitButton } from '@/app/components/Modal'
import type { TeamsPageViewModel } from '@/app/pages/Teams/hooks/useTeamsPageController'

type TeamsCreateModalProps = {
  vm: TeamsPageViewModel
}

export function TeamsCreateModal({ vm }: TeamsCreateModalProps) {
  const {
    showCreateModal,
    setShowCreateModal,
    formError,
    formName,
    setFormName,
    formDesc,
    setFormDesc,
    formLoading,
    handleCreate,
    tokens,
  } = vm

  return (
    <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Новая команда">
      <ErrorMessage message={formError} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleCreate()
        }}
        className="space-y-4"
      >
        <InputField label="Название" value={formName} onChange={setFormName} required />
        <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowCreateModal(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${tokens.textSecondary}`}
          >
            Отмена
          </button>
          <SubmitButton loading={formLoading}>Создать</SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
