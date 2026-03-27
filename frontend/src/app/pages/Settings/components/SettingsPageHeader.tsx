type SettingsPageHeaderProps = {
  textPrimary: string
  textSecondary: string
}

export function SettingsPageHeader({ textPrimary, textSecondary }: SettingsPageHeaderProps) {
  return (
    <div className="mb-6 md:mb-8 page-load-stagger">
      <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Настройки</h1>
      <p className={`mt-1 text-sm ${textSecondary}`}>Управление аккаунтом и предпочтениями</p>
    </div>
  )
}
