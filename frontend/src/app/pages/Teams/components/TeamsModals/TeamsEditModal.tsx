import { ErrorMessage, InputField, Modal, SubmitButton } from '@/app/components/Modal'
import type { TeamsEditModalProps } from '@/app/pages/Teams/types'

export function TeamsEditModal({ model }: TeamsEditModalProps) {
  const { teamForm, handlers, ui } = model
  const {
    showEditModal,
    setShowEditModal,
    formError,
    formName,
    setFormName,
    formDesc,
    setFormDesc,
    formLoading,
  } = teamForm
  const { handleEdit } = handlers

  return (
    <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать команду">
      <ErrorMessage message={formError} />
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void handleEdit()
        }}
        className="space-y-4"
      >
        <InputField label="Название" value={formName} onChange={setFormName} required />
        <InputField label="Описание" value={formDesc} onChange={setFormDesc} />
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowEditModal(false)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold ${ui.textSecondary}`}
          >
            Отмена
          </button>
          <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
        </div>
      </form>
    </Modal>
  )
}
