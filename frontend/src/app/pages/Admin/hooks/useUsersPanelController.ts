import { useForm, type UseFormReturn } from 'react-hook-form'
import { useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/app/api/users'
import { useAdminUsersQuery } from '@/app/features/admin/admin-queries'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { appQueryKeys } from '@/app/query'
import { AccountRole, type User, type UserAccountStatus } from '@/app/types'
import { validatePasswordPolicy } from '@/app/utils/passwordPolicy'
import { useUsersPanelListState } from '@/app/pages/Admin/hooks/useUsersPanelListState'
import { useUsersPanelModalState } from '@/app/pages/Admin/hooks/useUsersPanelModalState'

export type CreateUserFormValues = {
  login: string
  password: string
  fullName: string
  profession: string
  role: AccountRole
}

export type EditUserFormValues = {
  fullName: string
  profession: string
  role: AccountRole
  status: UserAccountStatus
}

type UseUsersPanelControllerParams = {
  onOpenAuditForUser: (userId: number) => void
}

export function useUsersPanelController({ onOpenAuditForUser }: UseUsersPanelControllerParams) {
  const queryClient = useQueryClient()
  const { searchTerm, setSearchTerm, deferredSearchTerm, page, setPage, limit } = useUsersPanelListState()
  const modal = useUsersPanelModalState()
  const {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    editingUser,
    setEditingUser,
    formLoading,
    setFormLoading,
    formError,
    setFormError,
  } = modal

  const createForm = useForm<CreateUserFormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      login: '',
      password: '',
      fullName: '',
      profession: '',
      role: AccountRole.MEMBER,
    },
  })
  const editForm = useForm<EditUserFormValues>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: {
      fullName: '',
      profession: '',
      role: AccountRole.MEMBER,
      status: 'active',
    },
  })

  const usersQuery = useAdminUsersQuery({ searchTerm: deferredSearchTerm, page, limit })
  const users = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const showInitialSkeleton = useSmoothPageSkeleton(usersQuery.isPending && !usersQuery.data)
  const isRefreshing = usersQuery.isFetching && !!usersQuery.data
  const filledRowsCount = users.length === 0 ? 1 : users.length
  const emptyRowsCount = showInitialSkeleton ? 0 : Math.max(0, limit - filledRowsCount)

  const invalidateAdminData = async () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: appQueryKeys.admin.usersRoot }),
      queryClient.invalidateQueries({ queryKey: appQueryKeys.admin.auditRoot }),
      queryClient.invalidateQueries({ queryKey: appQueryKeys.auth.me }),
    ])

  const openCreateModal = () => {
    createForm.reset()
    setFormError('')
    setShowCreateModal(true)
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    editForm.reset({
      fullName: user.fullName,
      profession: user.profession || '',
      role: user.accountRole as AccountRole,
      status: user.accountStatus,
    })
    setFormError('')
    setShowEditModal(true)
  }

  const handleCreate = async () => {
    setFormError('')
    const values = createForm.getValues()
    const pwdErr = validatePasswordPolicy(values.password)
    if (pwdErr) {
      setFormError(pwdErr)
      return
    }

    setFormLoading(true)
    try {
      await usersApi.create({
        login: values.login,
        password: values.password,
        fullName: values.fullName,
        profession: values.profession || undefined,
        accountRole: values.role,
      })
      setShowCreateModal(false)
      createForm.reset()
      await invalidateAdminData()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingUser) {
      return
    }

    setFormLoading(true)
    setFormError('')
    try {
      const values = editForm.getValues()
      await usersApi.update(editingUser.id, {
        fullName: values.fullName,
        profession: values.profession,
        accountRole: values.role,
        accountStatus: values.status,
      })
      setShowEditModal(false)
      setEditingUser(null)
      editForm.reset()
      await invalidateAdminData()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) {
      return
    }

    try {
      await usersApi.delete(id)
      await invalidateAdminData()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка')
    }
  }

  return {
    createForm,
    deferredSearchTerm,
    editForm,
    emptyRowsCount,
    formError,
    formLoading,
    handleCreate,
    handleDelete,
    handleEdit,
    isRefreshing,
    limit,
    onOpenAuditForUser,
    openCreateModal,
    openEditModal,
    page,
    searchTerm,
    setPage,
    setSearchTerm,
    setShowCreateModal,
    setShowEditModal,
    showCreateModal,
    showEditModal,
    showInitialSkeleton,
    total,
    totalPages,
    users,
    usersQuery,
  }
}

export type UsersPanelController = ReturnType<typeof useUsersPanelController>
export type CreateUserForm = UseFormReturn<CreateUserFormValues>
export type EditUserForm = UseFormReturn<EditUserFormValues>
