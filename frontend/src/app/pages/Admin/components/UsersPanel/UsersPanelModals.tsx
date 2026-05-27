import { Controller } from 'react-hook-form'
import { ACCOUNT_ROLE_LABELS, AccountRole, type UserAccountStatus } from '@/app/types'
import { ErrorMessage, InputField, Modal, SelectField, SubmitButton } from '@/app/components/Modal'
import { PASSWORD_POLICY_HINT } from '@/app/utils/passwordPolicy'
import type { UsersPanelModalsProps } from '@/app/pages/Admin/types'

export function UsersPanelModals({
  createForm,
  editForm,
  formError,
  formLoading,
  showCreateModal,
  showEditModal,
  textSecondary,
  onCloseCreateModal,
  onCloseEditModal,
  onSubmitCreate,
  onSubmitEdit,
}: UsersPanelModalsProps) {
  return (
    <>
      <Modal open={showCreateModal} onClose={onCloseCreateModal} title="Создать пользователя">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmitCreate()
          }}
          className="space-y-4"
        >
          <Controller
            control={createForm.control}
            name="fullName"
            rules={{ required: true }}
            render={({ field }) => (
              <InputField
                label="ФИО"
                value={field.value}
                onChange={field.onChange}
                required
                placeholder="Иванов Иван"
              />
            )}
          />
          <Controller
            control={createForm.control}
            name="login"
            rules={{ required: true }}
            render={({ field }) => (
              <InputField
                label="Логин"
                value={field.value}
                onChange={field.onChange}
                required
                placeholder="ivanov"
              />
            )}
          />
          <Controller
            control={createForm.control}
            name="password"
            rules={{ required: true }}
            render={({ field }) => (
              <InputField
                label="Пароль"
                value={field.value}
                onChange={field.onChange}
                type="password"
                required
                placeholder="Например, SecurePass1!"
                hint={PASSWORD_POLICY_HINT}
              />
            )}
          />
          <Controller
            control={createForm.control}
            name="profession"
            render={({ field }) => (
              <InputField
                label="Должность"
                value={field.value}
                onChange={field.onChange}
                placeholder="Developer"
              />
            )}
          />
          <Controller
            control={createForm.control}
            name="role"
            render={({ field }) => (
              <SelectField
                label="Роль"
                value={field.value}
                onChange={(value) => field.onChange(value as AccountRole)}
                options={Object.entries(ACCOUNT_ROLE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            )}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCloseCreateModal}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal open={showEditModal} onClose={onCloseEditModal} title="Редактировать пользователя">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            onSubmitEdit()
          }}
          className="space-y-4"
        >
          <Controller
            control={editForm.control}
            name="fullName"
            rules={{ required: true }}
            render={({ field }) => (
              <InputField label="ФИО" value={field.value} onChange={field.onChange} required />
            )}
          />
          <Controller
            control={editForm.control}
            name="profession"
            render={({ field }) => (
              <InputField label="Должность" value={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            control={editForm.control}
            name="role"
            render={({ field }) => (
              <SelectField
                label="Роль"
                value={field.value}
                onChange={(value) => field.onChange(value as AccountRole)}
                options={Object.entries(ACCOUNT_ROLE_LABELS).map(([value, label]) => ({ value, label }))}
              />
            )}
          />
          <Controller
            control={editForm.control}
            name="status"
            render={({ field }) => (
              <SelectField
                label="Статус"
                value={field.value}
                onChange={(value) => field.onChange(value as UserAccountStatus)}
                options={[
                  { value: 'active', label: 'Активен' },
                  { value: 'blocked', label: 'Заблокирован' },
                ]}
              />
            )}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCloseEditModal}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}
