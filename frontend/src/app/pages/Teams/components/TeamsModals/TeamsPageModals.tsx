import { TeamsAddMemberModal } from './TeamsAddMemberModal'
import { TeamsCreateModal } from './TeamsCreateModal'
import { TeamsEditModal } from './TeamsEditModal'
import type { TeamsPageModalsProps } from '@/app/pages/Teams/types'

export function TeamsPageModals({ model }: TeamsPageModalsProps) {
  return (
    <>
      <TeamsCreateModal model={model} />
      <TeamsEditModal model={model} />
      <TeamsAddMemberModal model={model} />
    </>
  )
}
