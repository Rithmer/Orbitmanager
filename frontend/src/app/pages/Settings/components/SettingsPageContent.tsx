import { useNavigate } from 'react-router'
import { useAuth } from '@/app/context/useAuth'
import { useSettingsThemeTokens } from '@/app/pages/Settings/hooks/useSettingsThemeTokens'
import { useProfileSettings } from '@/app/pages/Settings/hooks/useProfileSettings'
import { usePasswordSettings } from '@/app/pages/Settings/hooks/usePasswordSettings'
import { SettingsPageHeader } from '@/app/pages/Settings/components/SettingsPageHeader'
import { SettingsProfileSection } from '@/app/pages/Settings/components/SettingsProfileSection'
import { SettingsAppearanceSection } from '@/app/pages/Settings/components/SettingsAppearanceSection'
import { SettingsSecuritySection } from '@/app/pages/Settings/components/SettingsSecuritySection'

export function SettingsPageContent() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const theme = useSettingsThemeTokens()
  const profile = useProfileSettings()
  const password = usePasswordSettings()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className={`${theme.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <SettingsPageHeader textPrimary={theme.textPrimary} textSecondary={theme.textSecondary} />
      <div className="max-w-3xl space-y-6 page-load-stagger">
        <SettingsProfileSection
          cardBg={theme.cardBg}
          cardBorder={theme.cardBorder}
          dividerColor={theme.dividerColor}
          sectionIconBg={theme.sectionIconBg}
          textPrimary={theme.textPrimary}
          textSecondary={theme.textSecondary}
          inputBg={theme.inputBg}
          inputText={theme.inputText}
          user={profile.user}
          fullName={profile.fullName}
          setFullName={profile.setFullName}
          profession={profile.profession}
          setProfession={profile.setProfession}
          saving={profile.saving}
          error={profile.error}
          success={profile.success}
          avatarUrlPreview={profile.avatarUrlPreview}
          avatarUploading={profile.avatarUploading}
          avatarUploadError={profile.avatarUploadError}
          avatarUploadSuccess={profile.avatarUploadSuccess}
          avatarInputRef={profile.avatarInputRef}
          onSaveProfile={() => void profile.saveProfile()}
          onAvatarFileChange={profile.uploadAvatarFile}
        />
        <SettingsAppearanceSection
          isDark={theme.isDark}
          toggleTheme={theme.toggleTheme}
          cardBg={theme.cardBg}
          cardBorder={theme.cardBorder}
          textPrimary={theme.textPrimary}
          textSecondary={theme.textSecondary}
          dividerColor={theme.dividerColor}
          sectionIconBg={theme.sectionIconBg}
        />
        <SettingsSecuritySection
          isDark={theme.isDark}
          cardBg={theme.cardBg}
          cardBorder={theme.cardBorder}
          dividerColor={theme.dividerColor}
          sectionIconBg={theme.sectionIconBg}
          textPrimary={theme.textPrimary}
          textSecondary={theme.textSecondary}
          inputBg={theme.inputBg}
          inputText={theme.inputText}
          isChangePasswordOpen={password.isChangePasswordOpen}
          currentPassword={password.currentPassword}
          newPassword={password.newPassword}
          confirmNewPassword={password.confirmNewPassword}
          changePasswordLoading={password.changePasswordLoading}
          changePasswordError={password.changePasswordError}
          changePasswordSuccess={password.changePasswordSuccess}
          setCurrentPassword={password.setCurrentPassword}
          setNewPassword={password.setNewPassword}
          setConfirmNewPassword={password.setConfirmNewPassword}
          onTogglePasswordForm={password.togglePasswordForm}
          onChangePassword={() => void password.changePassword()}
          onLogout={handleLogout}
        />
      </div>
    </div>
  )
}
