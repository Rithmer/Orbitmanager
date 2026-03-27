import { Plus, Search, Users } from 'lucide-react'
import { useTheme } from '@/app/context/useTheme'
import { AccountRole } from '@/app/types'
import { ROLE_COLORS } from '@/app/pages/Admin/constants'
import { useUsersPanelController } from '@/app/pages/Admin/hooks/useUsersPanelController'
import { UsersTable } from '@/app/pages/Admin/components/UsersTable'
import { UsersPanelModals } from '@/app/pages/Admin/components/UsersPanelModals'

export function UsersPanel({ onOpenAuditForUser }: { onOpenAuditForUser: (userId: number) => void }) {
  const { isDark } = useTheme()
  const controller = useUsersPanelController({ onOpenAuditForUser })

  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const rowHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
  const inputBg = isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'
  const roleColorFor = (role: AccountRole) => {
    if (role === AccountRole.GUEST) {
      return isDark ? 'text-[#94a3b8] bg-[#94a3b8]/10' : ROLE_COLORS[AccountRole.GUEST]
    }
    return ROLE_COLORS[role] || ''
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 page-load-stagger">
        <div className="relative flex-1 sm:max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={controller.searchTerm}
            onChange={(event) => {
              controller.setSearchTerm(event.target.value)
              controller.setPage(1)
            }}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg}`}
          />
        </div>
        <button
          onClick={controller.openCreateModal}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 btn-fizzy"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>
      {controller.usersQuery.isError && !controller.usersQuery.data ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Users className="w-10 h-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>
            Не удалось загрузить пользователей.
          </p>
          <button
            onClick={() => controller.usersQuery.refetch()}
            className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            Повторить
          </button>
        </div>
      ) : (
        <UsersTable
          cardBg={cardBg}
          cardBorder={cardBorder}
          deferredSearchTerm={controller.deferredSearchTerm}
          emptyRowsCount={controller.emptyRowsCount}
          isDark={isDark}
          isRefreshing={controller.isRefreshing}
          limit={controller.limit}
          page={controller.page}
          roleColorFor={roleColorFor}
          rowHover={rowHover}
          showInitialSkeleton={controller.showInitialSkeleton}
          textPrimary={textPrimary}
          textSecondary={textSecondary}
          total={controller.total}
          totalPages={controller.totalPages}
          users={controller.users}
          onDeleteUser={controller.handleDelete}
          onEditUser={controller.openEditModal}
          onOpenAuditForUser={controller.onOpenAuditForUser}
          onPageChange={controller.setPage}
        />
      )}

      <UsersPanelModals
        createForm={controller.createForm}
        editForm={controller.editForm}
        formError={controller.formError}
        formLoading={controller.formLoading}
        showCreateModal={controller.showCreateModal}
        showEditModal={controller.showEditModal}
        textSecondary={textSecondary}
        onCloseCreateModal={() => controller.setShowCreateModal(false)}
        onCloseEditModal={() => controller.setShowEditModal(false)}
        onSubmitCreate={() => void controller.handleCreate()}
        onSubmitEdit={() => void controller.handleEdit()}
      />
    </>
  )
}
