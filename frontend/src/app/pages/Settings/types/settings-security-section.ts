export type SettingsSecuritySectionProps = {
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
