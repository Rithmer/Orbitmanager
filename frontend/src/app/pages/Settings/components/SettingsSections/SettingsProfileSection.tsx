import { Pencil, User } from 'lucide-react'
import { ErrorMessage } from '@/app/components/Modal'
import { ACCOUNT_ROLE_LABELS, AccountRole } from '@/app/types'
import { abbreviateFullName } from '@/app/pages/Settings/helpers'
import type { SettingsProfileSectionProps } from '@/app/pages/Settings/types'

export function SettingsProfileSection(props: SettingsProfileSectionProps) {
  const {
    cardBg,
    cardBorder,
    dividerColor,
    sectionIconBg,
    textPrimary,
    textSecondary,
    inputBg,
    inputText,
    user,
    fullName,
    setFullName,
    profession,
    setProfession,
    saving,
    error,
    success,
    avatarUrlPreview,
    avatarUploading,
    avatarUploadError,
    avatarUploadSuccess,
    avatarInputRef,
    onSaveProfile,
    onAvatarFileChange,
  } = props

  const userInitial = user?.fullName?.charAt(0)?.toUpperCase() || 'U'
  const roleLabel = user ? ACCOUNT_ROLE_LABELS[user.accountRole as AccountRole] || user.accountRole : ''

  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden card-hover stagger-row`}>
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${dividerColor}`}>
        <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center`}>
          <User className="w-4 h-4 text-[#4880ff]" />
        </div>
        <h2 className={`font-bold ${textPrimary}`}>Профиль</h2>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-4 mb-6 min-w-0">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            disabled={avatarUploading}
            className="group relative w-16 h-16 rounded-full overflow-hidden bg-[#4880ff] flex items-center justify-center text-white text-xl font-bold"
          >
            {avatarUrlPreview ? <img src={avatarUrlPreview} alt="Аватар" className="w-full h-full object-cover" /> : userInitial}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
              <Pencil className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
          <div className="min-w-0">
            <p className={`font-bold truncate ${textPrimary}`} title={abbreviateFullName(user?.fullName) || 'Пользователь'}>
              {abbreviateFullName(user?.fullName) || 'Пользователь'}
            </p>
            <p className={`text-sm truncate ${textSecondary}`} title={`${roleLabel} · ${user?.login || ''}`}>
              {roleLabel} · {user?.login}
            </p>
          </div>
        </div>

        <input
          ref={avatarInputRef}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.gif,.bmp,.tif,.tiff,.heic,.heif,image/png,image/jpeg,image/webp,image/gif,image/bmp,image/tiff,image/heic,image/heif"
          onChange={(event) => onAvatarFileChange(event.target.files?.[0] ?? null)}
          disabled={avatarUploading}
          className="hidden"
        />

        {avatarUploading ? <div className="text-xs text-[#4880ff]">Загрузка аватара...</div> : null}
        {avatarUploadError ? <div><ErrorMessage message={avatarUploadError} /></div> : null}
        {avatarUploadSuccess ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
            <p className="text-sm text-emerald-500">{avatarUploadSuccess}</p>
          </div>
        ) : null}

        <ErrorMessage message={error} />
        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-emerald-500">{success}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>ФИО</label>
            <input
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
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
              onChange={(event) => setProfession(event.target.value)}
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
          onClick={onSaveProfile}
          disabled={saving}
          className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-50 flex items-center gap-2 btn-fizzy"
        >
          {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
          Сохранить изменения
        </button>
      </div>
    </div>
  )
}
