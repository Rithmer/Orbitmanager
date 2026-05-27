import type { AdminPageUiTokens } from '@/app/pages/Admin/types'

type AdminPageHeaderProps = {
  ui: Pick<AdminPageUiTokens, 'textPrimary' | 'textSecondary'>
}

export function AdminPageHeader({ ui }: AdminPageHeaderProps) {
  const { textPrimary, textSecondary } = ui

  return (
    <div className="mb-6">
      <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Админ-панель</h1>
      <p className={`mt-1 text-sm ${textSecondary}`}>Управление пользователями, аудит и ML-модель</p>
    </div>
  )
}
