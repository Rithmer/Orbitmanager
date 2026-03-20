import { useDeferredValue, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Users,
  Search,
  Plus,
  Trash2,
  Edit3,
  ChevronLeft,
  ChevronRight,
  FileText,
  Clock,
} from 'lucide-react'
import { Navigate } from 'react-router'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { usersApi } from '../api/users'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import type { User } from '../types'
import { AccountRole, ACCOUNT_ROLE_LABELS, AuditAction } from '../types'
import { appQueryKeys } from '../query'
import {
  adminAuditQueryPrefix,
  adminUsersQueryPrefix,
  useAdminAuditQuery,
  useAdminUsersQuery,
} from '../features/admin/admin-queries'
import { useSmoothPageSkeleton } from '../hooks/useSmoothPageSkeleton'

type Tab = 'users' | 'audit'

const USERS_PAGE_SIZE = 15
const AUDIT_PAGE_SIZE = 20

export function Admin() {
  const { isDark } = useTheme()
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')

  if (!isAdmin) return <Navigate to="/" replace />

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const tabActive = 'bg-[#4880ff] text-white'
  const tabInactive = isDark ? 'bg-[#273142] text-[#94a3b8] hover:text-white' : 'bg-white text-gray-500 hover:text-gray-700'

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <div className="mb-6">
        <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Админ-панель</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>Управление пользователями и аудит</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { key: 'users' as Tab, label: 'Пользователи', icon: Users },
          { key: 'audit' as Tab, label: 'Журнал аудита', icon: FileText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${activeTab === tab.key ? tabActive : tabInactive}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UsersPanel />}
      {activeTab === 'audit' && <AuditPanel />}
    </div>
  )
}

function UsersPanel() {
  const { isDark } = useTheme()
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const deferredSearchTerm = useDeferredValue(searchTerm)
  const [page, setPage] = useState(1)
  const limit = USERS_PAGE_SIZE

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formLogin, setFormLogin] = useState('')
  const [formPassword, setFormPassword] = useState('')
  const [formFullName, setFormFullName] = useState('')
  const [formProfession, setFormProfession] = useState('')
  const [formRole, setFormRole] = useState(AccountRole.MEMBER)
  const [formStatus, setFormStatus] = useState('active')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const rowHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'
  const inputBg = isDark
    ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]'
    : 'bg-white border-[#e8e8e8] text-[#202224]'

  const usersQuery = useAdminUsersQuery({
    searchTerm: deferredSearchTerm,
    page,
    limit,
  })

  const users = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const isInitialLoad = usersQuery.isPending && !usersQuery.data
  const isRefreshing = usersQuery.isFetching && !!usersQuery.data
  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoad)

  const filledRowsCount = users.length === 0 ? 1 : users.length
  const emptyRowsCount =
    showInitialSkeleton ? 0 : Math.max(0, limit - filledRowsCount)

  const invalidateAdminData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: adminUsersQueryPrefix }),
      queryClient.invalidateQueries({ queryKey: adminAuditQueryPrefix }),
      queryClient.invalidateQueries({ queryKey: appQueryKeys.auth.me }),
    ])
  }

  const handleCreate = async () => {
    setFormLoading(true)
    setFormError('')
    try {
      await usersApi.create({
        login: formLogin,
        password: formPassword,
        fullName: formFullName,
        profession: formProfession || undefined,
        accountRole: formRole,
      })
      setShowCreateModal(false)
      setFormLogin('')
      setFormPassword('')
      setFormFullName('')
      setFormProfession('')
      setFormRole(AccountRole.MEMBER)
      await invalidateAdminData()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editingUser) return
    setFormLoading(true)
    setFormError('')
    try {
      await usersApi.update(editingUser.id, {
        fullName: formFullName,
        profession: formProfession,
        accountRole: formRole,
        accountStatus: formStatus,
      })
      setShowEditModal(false)
      setEditingUser(null)
      await invalidateAdminData()
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return
    try {
      await usersApi.delete(id)
      await invalidateAdminData()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Ошибка')
    }
  }

  const roleColors: Record<string, string> = {
    [AccountRole.ADMIN]: 'text-red-500 bg-red-500/10',
    [AccountRole.MEMBER]: 'text-[#4880ff] bg-[#4880ff]/10',
    [AccountRole.GUEST]: isDark ? 'text-[#94a3b8] bg-[#94a3b8]/10' : 'text-gray-500 bg-gray-100',
  }

  const statusColors: Record<string, string> = {
    active: 'text-emerald-500 bg-emerald-500/10',
    blocked: 'text-red-500 bg-red-500/10',
    inactive: isDark ? 'text-[#94a3b8] bg-[#94a3b8]/10' : 'text-gray-500 bg-gray-100',
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 page-load-stagger">
        <div className="relative flex-1 sm:max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value)
              setPage(1)
            }}
            className={`w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg}`}
          />
        </div>
        <button
          onClick={() => {
            setFormLogin('')
            setFormPassword('')
            setFormFullName('')
            setFormProfession('')
            setFormRole(AccountRole.MEMBER)
            setFormError('')
            setShowCreateModal(true)
          }}
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 btn-fizzy"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>

      {usersQuery.isError && !usersQuery.data ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Users className="w-10 h-10 text-red-500" />
          <p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>
            Не удалось загрузить пользователей.
          </p>
          <button
            onClick={() => usersQuery.refetch()}
            className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
          >
            Повторить
          </button>
        </div>
      ) : (
        <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden page-load-stagger`}>
          {isRefreshing && (
            <div className={`px-4 py-2 text-xs font-semibold ${textSecondary} border-b ${cardBorder}`}>
              Обновление данных...
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'}>
                  {['ID', 'Логин', 'ФИО', 'Должность', 'Роль', 'Статус', 'Действия'].map((header) => (
                    <th key={header} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {showInitialSkeleton ? (
                  <UsersTableSkeleton rowCount={6} />
                ) : (
                  <>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} ${rowHover} transition-colors`}
                      >
                        <td className={`px-4 py-3 text-sm ${textSecondary}`}>{user.id}</td>
                        <td className={`px-4 py-3 text-sm font-semibold ${textPrimary}`}>{user.login}</td>
                        <td className={`px-4 py-3 text-sm ${textPrimary}`}>{user.fullName}</td>
                        <td className={`px-4 py-3 text-sm ${textSecondary}`}>{user.profession || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[user.accountRole] || ''}`}>
                            {ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[user.accountStatus] || ''}`}>
                            {user.accountStatus === 'active'
                              ? 'Активен'
                              : user.accountStatus === 'blocked'
                                ? 'Заблокирован'
                                : 'Неактивен'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingUser(user)
                                setFormFullName(user.fullName)
                                setFormProfession(user.profession || '')
                                setFormRole(user.accountRole as AccountRole)
                                setFormStatus(user.accountStatus)
                                setFormError('')
                                setShowEditModal(true)
                              }}
                              className="p-1.5 rounded hover:bg-[#4880ff]/10 text-[#4880ff] transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="p-1.5 rounded hover:bg-red-500/10 text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className={`text-center py-8 text-sm ${textSecondary}`}>
                          {deferredSearchTerm ? 'Пользователи не найдены' : 'Пользователей пока нет'}
                        </td>
                      </tr>
                    )}
                    {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                      <tr
                        // Intentionally stable blank rows for consistent table height
                        key={`empty-user-row-${idx}`}
                        className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} transition-colors`}
                      >
                        <td colSpan={7} className={`px-4 py-3 text-sm ${textSecondary}`}>
                          &nbsp;
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
              <p className={`text-xs ${textSecondary}`}>
                Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}
                >
                  <ChevronLeft className={`w-4 h-4 ${textSecondary}`} />
                </button>
                <span className={`text-xs font-semibold px-2 ${textPrimary}`}>{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded transition-colors disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}
                >
                  <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Создать пользователя">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleCreate()
          }}
          className="space-y-4"
        >
          <InputField label="ФИО" value={formFullName} onChange={setFormFullName} required placeholder="Иванов Иван" />
          <InputField label="Логин" value={formLogin} onChange={setFormLogin} required placeholder="ivanov" />
          <InputField label="Пароль" value={formPassword} onChange={setFormPassword} type="password" required placeholder="Минимум 8 символов" />
          <InputField label="Должность" value={formProfession} onChange={setFormProfession} placeholder="Developer" />
          <SelectField
            label="Роль"
            value={formRole}
            onChange={(value) => setFormRole(value as AccountRole)}
            options={Object.entries(ACCOUNT_ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}
            >
              Отмена
            </button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать пользователя">
        <ErrorMessage message={formError} />
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void handleEdit()
          }}
          className="space-y-4"
        >
          <InputField label="ФИО" value={formFullName} onChange={setFormFullName} required />
          <InputField label="Должность" value={formProfession} onChange={setFormProfession} />
          <SelectField
            label="Роль"
            value={formRole}
            onChange={(value) => setFormRole(value as AccountRole)}
            options={Object.entries(ACCOUNT_ROLE_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <SelectField
            label="Статус"
            value={formStatus}
            onChange={setFormStatus}
            options={[
              { value: 'active', label: 'Активен' },
              { value: 'blocked', label: 'Заблокирован' },
              { value: 'inactive', label: 'Неактивен' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
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

function AuditPanel() {
  const { isDark } = useTheme()
  const [page, setPage] = useState(1)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const [filterUserId, setFilterUserId] = useState('')
  const limit = AUDIT_PAGE_SIZE

  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const rowHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'

  const parsedUserId = (() => {
    const trimmed = filterUserId.trim()
    if (!trimmed) return undefined
    const value = Number.parseInt(trimmed, 10)
    return Number.isFinite(value) ? value : undefined
  })()

  const auditQuery = useAdminAuditQuery({
    page,
    limit,
    action: filterAction as AuditAction | '',
    entityType: filterEntity,
    userId: parsedUserId,
  })

  const logs = auditQuery.data?.items ?? []
  const total = auditQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const isInitialLoad = auditQuery.isPending && !auditQuery.data
  const isRefreshing = auditQuery.isFetching && !!auditQuery.data
  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoad)

  const filledRowsCount = logs.length === 0 ? 1 : logs.length
  const emptyRowsCount =
    showInitialSkeleton ? 0 : Math.max(0, limit - filledRowsCount)

  const actionLabels: Record<string, { label: string; color: string }> = {
    [AuditAction.CREATE]: { label: 'Создание', color: 'text-emerald-500 bg-emerald-500/10' },
    [AuditAction.UPDATE]: { label: 'Обновление', color: 'text-[#4880ff] bg-[#4880ff]/10' },
    [AuditAction.DELETE]: { label: 'Удаление', color: 'text-red-500 bg-red-500/10' },
    [AuditAction.LOGIN]: { label: 'Вход', color: 'text-purple-500 bg-purple-500/10' },
    [AuditAction.LOGOUT]: { label: 'Выход', color: isDark ? 'text-[#94a3b8] bg-[#94a3b8]/10' : 'text-gray-500 bg-gray-100' },
    [AuditAction.ASSIGN]: { label: 'Назначение', color: 'text-amber-500 bg-amber-500/10' },
    [AuditAction.STATUS_CHANGE]: { label: 'Смена статуса', color: 'text-orange-500 bg-orange-500/10' },
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select
          value={filterAction}
          onChange={(event) => {
            setFilterAction(event.target.value)
            setPage(1)
          }}
          className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
        >
          <option value="">Все действия</option>
          {Object.entries(actionLabels).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={filterEntity}
          onChange={(event) => {
            setFilterEntity(event.target.value)
            setPage(1)
          }}
          className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
        >
          <option value="">Все сущности</option>
          {['user', 'team', 'project', 'task', 'team_member', 'project_member'].map((entity) => (
            <option key={entity} value={entity}>
              {entity}
            </option>
          ))}
        </select>
        <input
          value={filterUserId}
          onChange={(event) => {
            setFilterUserId(event.target.value)
            setPage(1)
          }}
          placeholder="ID пользователя"
          className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
        />
      </div>

      {auditQuery.isError && !auditQuery.data && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 mb-4">
          <FileText className="w-8 h-8 text-red-500" />
          <p className={`text-sm font-semibold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>Не удалось загрузить журнал аудита.</p>
          <button
            onClick={() => auditQuery.refetch()}
            className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-3 py-1.5 rounded-lg text-sm font-semibold"
          >
            Повторить
          </button>
        </div>
      )}

      {auditQuery.data && auditQuery.isError && (
        <ErrorMessage message="Не удалось обновить журнал аудита. Показаны предыдущие данные." />
      )}

      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        {isRefreshing && (
          <div className={`px-4 py-2 text-xs font-semibold ${textSecondary} border-b ${cardBorder}`}>
            Обновление данных...
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'}>
                {['Время', 'Пользователь', 'Действие', 'Сущность', 'ID', 'Старое', 'Новое', 'Описание'].map((header) => (
                  <th key={header} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showInitialSkeleton ? (
                <AuditTableSkeleton rowCount={8} />
              ) : (
                <>
                  {logs.map((log) => {
                    const action = actionLabels[log.action] || { label: log.action, color: '' }
                    return (
                      <tr
                        key={log.id}
                        className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} ${rowHover}`}
                      >
                        <td className={`px-4 py-3 text-xs ${textSecondary} whitespace-nowrap`}>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString('ru-RU')}
                          </div>
                        </td>
                        <td className={`px-4 py-3 text-xs ${textPrimary}`}>#{log.userId}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${action.color}`}>{action.label}</span>
                        </td>
                        <td className={`px-4 py-3 text-xs ${textPrimary}`}>{log.entityType}</td>
                        <td className={`px-4 py-3 text-xs ${textSecondary}`}>{log.entityId ?? '—'}</td>
                        <td className={`px-4 py-3 text-xs ${textSecondary} max-w-[120px] truncate`}>{log.oldValue || '—'}</td>
                        <td className={`px-4 py-3 text-xs ${textSecondary} max-w-[120px] truncate`}>{log.newValue || '—'}</td>
                        <td className={`px-4 py-3 text-xs ${textSecondary} max-w-[200px] truncate`}>{log.description || '—'}</td>
                      </tr>
                    )
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className={`text-center py-8 text-sm ${textSecondary}`}>
                        Записей нет
                      </td>
                    </tr>
                  )}
                  {Array.from({ length: emptyRowsCount }).map((_, idx) => (
                    <tr
                      // Intentionally stable blank rows for consistent table height
                      key={`empty-audit-row-${idx}`}
                      className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}
                    >
                      <td colSpan={8} className={`px-4 py-3 text-sm ${textSecondary}`}>
                        &nbsp;
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
            <p className={`text-xs ${textSecondary}`}>
              Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className={`p-1.5 rounded disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}
              >
                <ChevronLeft className={`w-4 h-4 ${textSecondary}`} />
              </button>
              <span className={`text-xs font-semibold px-2 ${textPrimary}`}>{page}/{totalPages}</span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className={`p-1.5 rounded disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}
              >
                <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
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

function AuditTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index} className="border-t border-gray-100">
          <td className="px-4 py-3">
            <div className="h-4 w-28 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-16 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-6 w-20 rounded-full bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-12 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
          <td className="px-4 py-3">
            <div className="h-4 w-32 rounded bg-gray-200/80 skeleton-shimmer" />
          </td>
        </tr>
      ))}
    </>
  )
}
