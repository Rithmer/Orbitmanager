import type { RisksPageContentPorts } from '@/app/pages/Risks/types/risks-page-content-ports'

export type RisksInsightAssignee = {
  userId: number
  fullName: string
  fitScore: number
  role: string
  profession: string
}

export type RisksInsightsSectionProps = {
  ports: RisksPageContentPorts
}
