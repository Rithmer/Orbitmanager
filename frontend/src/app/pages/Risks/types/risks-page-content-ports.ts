import type { useRisksPageController } from '@/app/pages/Risks/hooks/useRisksPageController'

export type RisksPageContentPorts = Pick<
  ReturnType<typeof useRisksPageController>,
  'theme' | 'selection' | 'data'
>
