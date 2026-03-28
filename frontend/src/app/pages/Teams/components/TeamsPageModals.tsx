import type { TeamsPageViewModel } from '@/app/pages/Teams/hooks/useTeamsPageController'
import { TeamsAddMemberModal } from '@/app/pages/Teams/components/TeamsAddMemberModal'
import { TeamsCreateModal } from '@/app/pages/Teams/components/TeamsCreateModal'
import { TeamsEditModal } from '@/app/pages/Teams/components/TeamsEditModal'

type TeamsPageModalsProps = {
  vm: TeamsPageViewModel
}

export function TeamsPageModals({ vm }: TeamsPageModalsProps) {
  return (
    <>
      <TeamsCreateModal vm={vm} />
      <TeamsEditModal vm={vm} />
      <TeamsAddMemberModal vm={vm} />
    </>
  )
}
