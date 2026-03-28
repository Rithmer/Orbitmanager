export function AdminPageHeader({
  textPrimary,
  textSecondary,
}: {
  textPrimary: string
  textSecondary: string
}) {
  return (
    <div className="mb-6">
      <h1 className={`text-xl md:text-2xl font-bold ${textPrimary}`}>Админ-панель</h1>
      <p className={`mt-1 text-sm ${textSecondary}`}>Управление пользователями, аудит и ML-модель</p>
    </div>
  )
}
