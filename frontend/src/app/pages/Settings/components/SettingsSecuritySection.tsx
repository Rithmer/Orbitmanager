import { ChevronRight, Lock, LogOut, Shield } from 'lucide-react'
import { ErrorMessage } from '@/app/components/Modal'

type SettingsSecuritySectionProps = {
  isDark: boolean
  cardBg: string
  cardBorder: string
  dividerColor: string
  sectionIconBg: string
  textPrimary: string
  textSecondary: string
  inputBg: string
  inputText: string
  isChangePasswordOpen: boolean
  currentPassword: string
  newPassword: string
  confirmNewPassword: string
  changePasswordLoading: boolean
  changePasswordError: string
  changePasswordSuccess: string
  setCurrentPassword: (value: string) => void
  setNewPassword: (value: string) => void
  setConfirmNewPassword: (value: string) => void
  onTogglePasswordForm: () => void
  onChangePassword: () => void
  onLogout: () => void
}

export function SettingsSecuritySection({
  isDark,
  cardBg,
  cardBorder,
  dividerColor,
  sectionIconBg,
  textPrimary,
  textSecondary,
  inputBg,
  inputText,
  isChangePasswordOpen,
  currentPassword,
  newPassword,
  confirmNewPassword,
  changePasswordLoading,
  changePasswordError,
  changePasswordSuccess,
  setCurrentPassword,
  setNewPassword,
  setConfirmNewPassword,
  onTogglePasswordForm,
  onChangePassword,
  onLogout,
}: SettingsSecuritySectionProps) {
  return (
    <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden card-hover stagger-row`}>
      <div className={`flex items-center gap-3 px-6 py-4 border-b ${dividerColor}`}>
        <div className={`w-8 h-8 ${sectionIconBg} rounded-lg flex items-center justify-center`}>
          <Shield className="w-4 h-4 text-[#4880ff]" />
        </div>
        <h2 className={`font-bold ${textPrimary}`}>Безопасность</h2>
      </div>
      <div className="p-6 space-y-2">
        <button
          onClick={onTogglePasswordForm}
          className="w-full flex items-center justify-between py-3 px-1 transition-colors rounded-lg hover:bg-[#4880ff]/5"
        >
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
        {isChangePasswordOpen ? (
          <div className={`mt-2 rounded-xl border ${cardBorder} p-4 ${isDark ? 'bg-[#1c2534]' : 'bg-white'}`}>
            <div className="space-y-3">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Текущий пароль</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>Новый пароль</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
                />
              </div>
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${textSecondary}`}>
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm transition-colors focus:outline-none focus:border-[#4880ff] ${inputBg} ${inputText}`}
                />
              </div>
            </div>
            {changePasswordError ? <div className="mt-3"><ErrorMessage message={changePasswordError} /></div> : null}
            {changePasswordSuccess ? (
              <div className="mt-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                <p className="text-sm text-emerald-500">{changePasswordSuccess}</p>
              </div>
            ) : null}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onChangePassword}
                disabled={changePasswordLoading}
                className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {changePasswordLoading ? 'Сохранение...' : 'Сменить пароль'}
              </button>
            </div>
          </div>
        ) : null}
        <button
          onClick={onLogout}
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
  )
}
