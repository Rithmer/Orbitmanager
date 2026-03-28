import { ChevronLeft, ChevronRight, Edit3, FileText, Trash2 } from 'lucide-react'
import { ACCOUNT_ROLE_LABELS, AccountRole } from '@/app/types'
import { STATUS_COLORS } from '@/app/pages/Admin/constants'
import type { UsersTableProps } from '@/app/pages/Admin/types'

export function UsersTable({
  cardBg,
  cardBorder,
  deferredSearchTerm,
  emptyRowsCount,
  isDark,
  isRefreshing,
  limit,
  page,
  roleColorFor,
  rowHover,
  showInitialSkeleton,
  textPrimary,
  textSecondary,
  total,
  totalPages,
  users,
  onDeleteUser,
  onEditUser,
  onOpenAuditForUser,
  onPageChange,
}: UsersTableProps) {
  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden page-load-stagger`}>
      {isRefreshing ? (
        <div className={`px-4 py-2 text-xs font-semibold ${textSecondary} border-b ${cardBorder}`}>
          Обновление данных...
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px]">
          <thead>
            <tr className={isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'}>
              {['ID', 'Логин', 'ФИО', 'Должность', 'Роль', 'Статус', 'Действия'].map((header) => (
                <th
                  key={header}
                  className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${textSecondary}`}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showInitialSkeleton ? <UsersTableSkeleton rowCount={6} /> : null}
            {!showInitialSkeleton
              ? users.map((user) => (
                  <tr
                    key={user.id}
                    className={`border-t ${
                      isDark ? 'border-[#313d4f]' : 'border-gray-100'
                    } ${rowHover} transition-colors`}
                  >
                    <td className={`px-4 py-3 text-sm ${textSecondary}`}>{user.id}</td>
                    <td className={`px-4 py-3 text-sm font-semibold ${textPrimary} max-w-[180px]`}>
                      <span className="block truncate" title={user.login}>
                        {user.login}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${textPrimary} max-w-[220px]`}>
                      <span className="block truncate" title={user.fullName}>
                        {user.fullName}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-sm ${textSecondary} max-w-[200px]`}>
                      <span className="block truncate" title={user.profession || '—'}>
                        {user.profession || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColorFor(user.accountRole as AccountRole)}`}
                      >
                        {ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[user.accountStatus]}`}
                      >
                        {user.accountStatus === 'active' ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditUser(user)}
                          className="p-1.5 rounded hover:bg-[#4880ff]/10 text-[#4880ff] transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenAuditForUser(user.id)}
                          className="p-1.5 rounded hover:bg-[#4880ff]/10 text-[#4880ff] transition-colors"
                          title="Открыть журнал аудита пользователя"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteUser(user.id)}
                          className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              : null}

            {!showInitialSkeleton && users.length === 0 ? (
              <tr>
                <td colSpan={7} className={`text-center py-8 text-sm ${textSecondary}`}>
                  {deferredSearchTerm ? 'Пользователи не найдены' : 'Пользователей пока нет'}
                </td>
              </tr>
            ) : null}

            {!showInitialSkeleton
              ? Array.from({ length: emptyRowsCount }).map((_, idx) => (
                  <tr
                    key={`empty-user-row-${idx}`}
                    className={`border-t ${
                      isDark ? 'border-[#313d4f]' : 'border-gray-100'
                    } transition-colors`}
                  >
                    <td colSpan={7} className={`px-4 py-3 text-sm ${textSecondary}`}>
                      &nbsp;
                    </td>
                  </tr>
                ))
              : null}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div
          className={`flex items-center justify-between px-4 py-3 border-t ${
            isDark ? 'border-[#313d4f]' : 'border-gray-100'
          }`}
        >
          <p className={`text-xs ${textSecondary}`}>
            Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className={`w-4 h-4 ${textSecondary}`} />
            </button>
            <span className={`text-xs font-semibold px-2 ${textPrimary}`}>
              {page}/{totalPages}
            </span>
            <button
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className={`p-1.5 rounded transition-colors disabled:opacity-30 ${
                isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'
              }`}
            >
              <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function UsersTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index} className="border-t border-gray-100">
          <td className="px-4 py-3">
            <div className="h-4 w-8 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-24 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-20 rounded-full bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-20 rounded-full bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-8 w-20 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
        </tr>
      ))}
    </>
  )
}
