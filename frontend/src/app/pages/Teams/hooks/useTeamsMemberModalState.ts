import { useState } from 'react'
import { TeamRole } from '@/app/types'

export function useTeamsMemberModalState() {
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [memberRole, setMemberRole] = useState(TeamRole.MEMBER)
  const [addMemberSearch, setAddMemberSearch] = useState('')

  return {
    showAddMemberModal,
    setShowAddMemberModal,
    selectedTeamId,
    setSelectedTeamId,
    memberRole,
    setMemberRole,
    addMemberSearch,
    setAddMemberSearch,
  }
}
