import { TeamsAddMemberModal } from './TeamsAddMemberModal'
import { TeamsCreateModal } from './TeamsCreateModal'
import { TeamsEditModal } from './TeamsEditModal'
import type { TeamsPageModalsProps } from '@/app/pages/Teams/types'

export function TeamsPageModals({ vm }: TeamsPageModalsProps) {
  return (
    <>
      <TeamsCreateModal vm={vm} />
      <TeamsEditModal vm={vm} />
      <TeamsAddMemberModal vm={vm} />
    </>
  )
}
