type ReportsSummaryWarningProps = { show: boolean }

export function ReportsSummaryWarning({ show }: ReportsSummaryWarningProps) {
  if (!show) return null
  return (
    <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
      Не удалось обновить данные. Показаны сохранённые значения.
    </div>
  )
}
