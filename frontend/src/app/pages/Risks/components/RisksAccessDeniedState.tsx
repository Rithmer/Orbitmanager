import { AlertCircle } from 'lucide-react'
import { PageSection, PageShell } from '@/app/components/PageShell'
import { RISKS_PAGE_CONSTANTS } from '@/app/pages/Risks/constants'

type RisksAccessDeniedStateProps = {
  textSecondary: string
}

export function RisksAccessDeniedState({ textSecondary }: RisksAccessDeniedStateProps) {
  return (
    <PageShell title={RISKS_PAGE_CONSTANTS.pageTitle} description={RISKS_PAGE_CONSTANTS.noAccessDescription}>
      <PageSection title="Нет доступа">
        <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500" />
          <p className={`text-sm ${textSecondary} max-w-md`}>{RISKS_PAGE_CONSTANTS.noAccessMessage}</p>
        </div>
      </PageSection>
    </PageShell>
  )
}
