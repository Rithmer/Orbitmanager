import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Moon, Sun, Lock, User, Shield, ChevronRight, LogOut } from 'lucide-react'
import { useTheme } from '../context/useTheme'
import { useAuth } from '../context/useAuth'
import { usersApi } from '../api/users'
import { ErrorMessage } from '../components/Modal'
import { ACCOUNT_ROLE_LABELS, AccountRole } from '../types'

export function Settings() {
  const { isDark, toggleTheme } = useTheme()
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profession, setProfession] = useState(user?.profession || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [avatarUrlPreview, setAvatarUrlPreview] = useState<string | null>(user?.avatarUrl ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState('')
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState('')

  useEffect(() => {
    setAvatarUrlPreview(user?.avatarUrl ?? null)
  }, [user?.avatarUrl])

  const pageBg = isDark ? 'bg-[#1c2534]' : 'bg-[#f5f6fa]'
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const dividerColor = isDark ? 'border-[#313d4f]' : 'border-gray-100'
  const inputBg = isDark ? 'bg-[#1c2534] border-[#313d4f]' : 'bg-gray-50 border-gray-200'
  const inputText = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const sectionIconBg = isDark ? 'bg-[#4880ff]/15' : 'bg-blue-50'

  const handleSaveProfile = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await usersApi.updateMe({ fullName, profession })
      await refreshUser()
      setSuccess('Изменения сохранены')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const abbreviateFullName = (name?: string | null) => {
    const full = (name ?? '').trim()
    if (!full) return ''
    const parts = full.split(/\s+/).filter(Boolean)
    if (parts.length < 2) return full
    const lastName = parts[0]
    const initials = parts
      .slice(1, 3)
      .map((p) => `${p.charAt(0).toUpperCase()}.`)
      .join(' ')
    // Example: "Иванов Алексей Петрович" => "Иванов А. П."
    return `${lastName} ${initials}`
  }

  const handleAvatarFileChange = (file: File | null) => {
    setAvatarUploadError('')
    setAvatarUploadSuccess('')
    if (!file) {
      setAvatarUrlPreview(null)
      return
    }

    // Upload contract is assumed to accept `avatarUrl` as a data url.
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setAvatarUrlPreview(result)
    }
    reader.onerror = () => {
      setAvatarUploadError('Не удалось прочитать файл изображения')
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAvatar = async () => {
    if (!user) return
    setAvatarUploading(true)
    setAvatarUploadError('')
    setAvatarUploadSuccess('')

    try {
      await usersApi.updateMe({ avatarUrl: avatarUrlPreview })
      await refreshUser()
      setAvatarUploadSuccess('Аватар обновлён')
      setTimeout(() => setAvatarUploadSuccess(''), 3000)
    } catch (err) {
      setAvatarUploadError(err instanceof Error ? err.message : 'Ошибка загрузки аватара')
    } finally {
      setAvatarUploading(false)
    }
  }

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || 'U'
  const roleLabel = user ? ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole : ''

  return (
    <div className={`${pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <div className="mb-6 md:mb-8 page-load-stagger">
        <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Настройки</h1>
        <p className={`mt-1 text-sm ${textSecondary}`}>Управление аккаунтом и предпочтениями</p>
      </div>

      <div className="max-w-3xl space-y-6 page-load-stagger">
        {/* Profile */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden card-hover stagger-row`}>
          <div className={`flex items-center gap-3 px-6 py-4 border-b ${dividerColor}`}>
            <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center`}>
              <User className="w-4 h-4 text-[#4880ff]" />
            </div>
            <h2 className={`font-bold ${textPrimary}`}>Профиль</h2>
          </div>
          <div className="p-6 space-y-5">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-[#4880ff] rounded-full flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {avatarUrlPreview ? (
                  <img src={avatarUrlPreview} alt="Аватар" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div>
                <p className={`font-bold ${textPrimary}`}>
                  {abbreviateFullName(user?.fullName) || 'Пользователь'}
                </p>
                <p className={`text-sm ${textSecondary}`}>
                  {roleLabel} · {user?.login}
                </p>
              </div>
            </div>

            <div className={`rounded-xl border ${cardBorder} p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-white'}`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-semibold ${textPrimary}`}>Аватар</p>
                  <p className={`text-xs mt-1 ${textSecondary}`}>Загрузите изображение — оно появится сразу после сохранения.</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleAvatarFileChange(e.target.files?.[0] ?? null)}
                  disabled={avatarUploading}
                  className={`text-xs ${isDark ? 'text-[#94a3b8]' : 'text-[#737373]'}`}
                />
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => void handleUploadAvatar()}
                  disabled={avatarUploading || !avatarUrlPreview}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    avatarUploading || !avatarUrlPreview
                      ? isDark
                        ? 'bg-[#4880ff]/15 text-[#94a3b8] cursor-not-allowed'
                        : 'bg-blue-50 text-[#737373] cursor-not-allowed'
                      : 'bg-[#4880ff] hover:bg-[#3a6fe0] text-white'
                  }`}
                >
                  {avatarUploading ? 'Загрузка...' : 'Загрузить'}
                </button>
              </div>

              {avatarUploadError ? (
                <div className="mt-3">
                  <ErrorMessage message={avatarUploadError} />
                </div>
              ) : null}
              {avatarUploadSuccess ? (
                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                  <p className="text-sm text-emerald-500">{avatarUploadSuccess}</p>
                </div>
              ) : null}
            </div>

            <ErrorMessage message={error} />
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
                <p className="text-sm text-emerald-500">{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>ФИО</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Логин</label>
                <input
                  value={user?.login || ''}
                  disabled
                  className={`w-full px-3 py-2 rounded-lg border text-sm opacity-50 cursor-not-allowed ${inputBg} ${inputText}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Должность</label>
                <input
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Роль</label>
                <input
                  value={roleLabel}
                  disabled
                  className={`w-full px-3 py-2 rounded-lg border text-sm opacity-50 cursor-not-allowed ${inputBg} ${inputText}`}
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2 btn-fizzy"
            >
              {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              Сохранить изменения
            </button>
          </div>
        </div>

        {/* Appearance */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden card-hover stagger-row`}>
          <div className={`flex items-center gap-3 px-6 py-4 border-b ${dividerColor}`}>
            <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center`}>
              {isDark ? <Sun className="w-4 h-4 text-[#4880ff]" /> : <Moon className="w-4 h-4 text-[#4880ff]" />}
            </div>
            <h2 className={`font-bold ${textPrimary}`}>Внешний вид</h2>
          </div>
          <div className="p-6">
            <p className={`font-semibold mb-1 ${textPrimary}`}>Тема оформления</p>
            <p className={`text-sm mb-4 ${textSecondary}`}>Выберите предпочитаемую тему</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Светлая', preview: 'bg-white border-[#e8e8e8]', active: !isDark, icon: Sun },
                { label: 'Тёмная', preview: 'bg-[#1b2431] border-[#273142]', active: isDark, icon: Moon },
              ].map((theme) => (
                <button
                  key={theme.label}
                  onClick={() => { if (!theme.active) toggleTheme() }}
                  className={`border-2 rounded-xl p-3 transition-all duration-150 ${
                    theme.active ? 'border-[#4880ff]' : isDark ? 'border-[#313d4f]' : 'border-gray-200'
                  }`}
                >
                  <div className={`${theme.preview} border rounded-lg p-3 mb-2`}>
                    <div className="flex gap-1.5 mb-2">
                      {[60, 40, 50].map((w, i) => (
                        <div key={i} className="h-1.5 bg-gray-300 rounded" style={{ width: `${w}%` }} />
                      ))}
                    </div>
                    <div className={`h-6 ${theme.active ? 'bg-[#4880ff]/20' : 'bg-gray-100'} rounded`} />
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <theme.icon className={`w-3.5 h-3.5 ${theme.active ? 'text-[#4880ff]' : textSecondary}`} />
                    <p className={`text-xs font-semibold ${theme.active ? 'text-[#4880ff]' : textSecondary}`}>
                      {theme.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security */}
        <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden card-hover stagger-row`}>
          <div className={`flex items-center gap-3 px-6 py-4 border-b ${dividerColor}`}>
            <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center`}>
              <Shield className="w-4 h-4 text-[#4880ff]" />
            </div>
            <h2 className={`font-bold ${textPrimary}`}>Безопасность</h2>
          </div>
          <div className="p-6 space-y-2">
            <button className={`w-full flex items-center justify-between py-3 px-1 transition-colors rounded-lg hover:bg-[#4880ff]/5`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center shrink-0`}>
                  <Lock className="w-4 h-4 text-[#4880ff]" />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${textPrimary}`}>Сменить пароль</p>
                  <p className={`text-xs ${textSecondary}`}>Обновить пароль аккаунта</p>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 ${textSecondary}`} />
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between py-3 px-1 transition-colors rounded-lg hover:bg-red-500/5"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center shrink-0">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-red-500">Выйти из аккаунта</p>
                  <p className={`text-xs ${textSecondary}`}>Завершить текущую сессию</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-red-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
