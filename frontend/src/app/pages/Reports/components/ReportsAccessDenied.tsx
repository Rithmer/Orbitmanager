import { AlertCircle } from 'lucide-react'
import { PageSection, PageShell } from '@/app/components/PageShell'
import type { ReportsAccessDeniedProps } from '@/app/pages/Reports/types'

export function ReportsAccessDenied({ textSecondary }: ReportsAccessDeniedProps) {
  return (
    <PageShell
      title="Аналитика"
      description="Раздел доступен администраторам, владельцам команд, тимлидам и наблюдателям прикреплённых проектов."
    >
      <PageSection title="Нет доступа">
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <p className={`text-sm ${textSecondary} max-w-md`}>
            Аналитика недоступна для роли «Разработчик» в проекте. Назначьте тимлида или наблюдателя, либо обратитесь к владельцу команды или администратору.
          </p>
        </div>
      </PageSection>
    </PageShell>
  )
}
