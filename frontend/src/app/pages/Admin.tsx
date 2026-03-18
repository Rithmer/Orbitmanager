import { useState, useEffect, useCallback } from 'react'
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
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { usersApi } from '../api/users'
import { auditApi } from '../api/audit'
import { Modal, InputField, SelectField, SubmitButton, ErrorMessage } from '../components/Modal'
import type { User, AuditLog } from '../types'
import { AccountRole, ACCOUNT_ROLE_LABELS, AuditAction } from '../types'
import { Navigate } from 'react-router'

type Tab = 'users' | 'audit'

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
    <div className={`${pageBg} min-h-full p-8`}>
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${textPrimary}`}>Админ-панель</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>Управление пользователями и аудит</p>
      </div>

      <div className="flex gap-2 mb-6">
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
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 15

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

  const loadUsers = useCallback(async () => {
    try {
      const res = await usersApi.list({ search: search || undefined, page, limit })
      setUsers(res.items)
      setTotal(res.total)
    } catch {
      /* skip */
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

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
      await loadUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
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
      await loadUsers()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить пользователя?')) return
    try {
      await usersApi.delete(id)
      await loadUsers()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  const totalPages = Math.ceil(total / limit)

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
          <input
            type="text"
            placeholder="Поиск пользователей..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
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
          className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold"
        >
          <Plus className="w-4 h-4" />
          Создать
        </button>
      </div>

      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'}>
                {['ID', 'Логин', 'ФИО', 'Должность', 'Роль', 'Статус', 'Действия'].map((h) => (
                  <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} ${rowHover} transition-colors`}>
                  <td className={`px-4 py-3 text-sm ${textSecondary}`}>{u.id}</td>
                  <td className={`px-4 py-3 text-sm font-semibold ${textPrimary}`}>{u.login}</td>
                  <td className={`px-4 py-3 text-sm ${textPrimary}`}>{u.fullName}</td>
                  <td className={`px-4 py-3 text-sm ${textSecondary}`}>{u.profession || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[u.accountRole] || ''}`}>
                      {ACCOUNT_ROLE_LABELS[u.accountRole as AccountRole] || u.accountRole}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColors[u.accountStatus] || ''}`}>
                      {u.accountStatus === 'active' ? 'Активен' : u.accountStatus === 'blocked' ? 'Заблокирован' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingUser(u)
                          setFormFullName(u.fullName)
                          setFormProfession(u.profession || '')
                          setFormRole(u.accountRole as AccountRole)
                          setFormStatus(u.accountStatus)
                          setFormError('')
                          setShowEditModal(true)
                        }}
                        className="p-1.5 rounded hover:bg-[#4880ff]/10 text-[#4880ff] transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
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
                  <td colSpan={7} className={`text-center py-8 text-sm ${textSecondary}`}>Пользователей не найдено</td>
                </tr>
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

      {/* Create User */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Создать пользователя">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleCreate() }} className="space-y-4">
          <InputField label="ФИО" value={formFullName} onChange={setFormFullName} required placeholder="Иванов Иван" />
          <InputField label="Логин" value={formLogin} onChange={setFormLogin} required placeholder="ivanov" />
          <InputField label="Пароль" value={formPassword} onChange={setFormPassword} type="password" required placeholder="Минимум 8 символов" />
          <InputField label="Должность" value={formProfession} onChange={setFormProfession} placeholder="Developer" />
          <SelectField
            label="Роль"
            value={formRole}
            onChange={(v) => setFormRole(v as AccountRole)}
            options={Object.entries(ACCOUNT_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowCreateModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Создать</SubmitButton>
          </div>
        </form>
      </Modal>

      {/* Edit User */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Редактировать пользователя">
        <ErrorMessage message={formError} />
        <form onSubmit={(e) => { e.preventDefault(); handleEdit() }} className="space-y-4">
          <InputField label="ФИО" value={formFullName} onChange={setFormFullName} required />
          <InputField label="Должность" value={formProfession} onChange={setFormProfession} />
          <SelectField
            label="Роль"
            value={formRole}
            onChange={(v) => setFormRole(v as AccountRole)}
            options={Object.entries(ACCOUNT_ROLE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
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
            <button type="button" onClick={() => setShowEditModal(false)} className={`px-4 py-2 rounded-lg text-sm font-semibold ${textSecondary}`}>Отмена</button>
            <SubmitButton loading={formLoading}>Сохранить</SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  )
}

function AuditPanel() {
  const { isDark } = useTheme()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filterAction, setFilterAction] = useState('')
  const [filterEntity, setFilterEntity] = useState('')
  const limit = 20

  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const rowHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res = await auditApi.list({
        page,
        limit,
        action: filterAction || undefined,
        entityType: filterEntity || undefined,
      })
      setLogs(res.items)
      setTotal(res.total)
    } catch {
      /* skip */
    } finally {
      setLoading(false)
    }
  }, [page, filterAction, filterEntity])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  const totalPages = Math.ceil(total / limit)

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
          onChange={(e) => { setFilterAction(e.target.value); setPage(1) }}
          className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
        >
          <option value="">Все действия</option>
          {Object.entries(actionLabels).map(([v, { label }]) => (
            <option key={v} value={v}>{label}</option>
          ))}
        </select>
        <select
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value); setPage(1) }}
          className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}
        >
          <option value="">Все сущности</option>
          {['user', 'team', 'project', 'task', 'team_member', 'project_member'].map((e) => (
            <option key={e} value={e}>{e}</option>
          ))}
        </select>
      </div>

      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#4880ff] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'}>
                  {['Время', 'Пользователь', 'Действие', 'Сущность', 'ID', 'Старое', 'Новое', 'Описание'].map((h) => (
                    <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => {
                  const act = actionLabels[log.action] || { label: log.action, color: '' }
                  return (
                    <tr key={log.id} className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} ${rowHover}`}>
                      <td className={`px-4 py-3 text-xs ${textSecondary} whitespace-nowrap`}>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.timestamp).toLocaleString('ru-RU')}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-xs ${textPrimary}`}>#{log.userId}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${act.color}`}>{act.label}</span>
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
                    <td colSpan={8} className={`text-center py-8 text-sm ${textSecondary}`}>Записей нет</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
            <p className={`text-xs ${textSecondary}`}>
              Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className={`p-1.5 rounded disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}>
                <ChevronLeft className={`w-4 h-4 ${textSecondary}`} />
              </button>
              <span className={`text-xs font-semibold px-2 ${textPrimary}`}>{page}/{totalPages}</span>
              <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={`p-1.5 rounded disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}>
                <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
