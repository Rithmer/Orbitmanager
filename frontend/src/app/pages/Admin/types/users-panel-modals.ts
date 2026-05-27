import type { CreateUserForm, EditUserForm } from '@/app/pages/Admin/hooks/useUsersPanelController'

export type UsersPanelModalsProps = {
  createForm: CreateUserForm
  editForm: EditUserForm
  formError: string
  formLoading: boolean
  showCreateModal: boolean
  showEditModal: boolean
  textSecondary: string
  onCloseCreateModal: () => void
  onCloseEditModal: () => void
  onSubmitCreate: () => void
  onSubmitEdit: () => void
}
