import { useState } from 'react'
import { ProjectRole } from '@/app/types'

export function useProjectsMembersModalState() {
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [membersStep, setMembersStep] = useState<'list' | 'add'>('list')
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null)
  const [memberUserId, setMemberUserId] = useState('')
  const [memberRole, setMemberRole] = useState(ProjectRole.DEVELOPER)
  const [pendingRemoveMemberId, setPendingRemoveMemberId] = useState<number | null>(null)

  const closeMembersModal = () => {
    setShowMembersModal(false)
    setMembersStep('list')
  }

  const goToMembersAddStep = () => {
    setMemberUserId('')
    setMemberRole(ProjectRole.DEVELOPER)
    setMembersStep('add')
  }

  const backToMembersListStep = () => {
    setMembersStep('list')
  }

  return {
    showMembersModal,
    setShowMembersModal,
    membersStep,
    setMembersStep,
    selectedProjectId,
    setSelectedProjectId,
    memberUserId,
    setMemberUserId,
    memberRole,
    setMemberRole,
    pendingRemoveMemberId,
    setPendingRemoveMemberId,
    closeMembersModal,
    goToMembersAddStep,
    backToMembersListStep,
  }
}

export type ProjectsMembersModalState = ReturnType<typeof useProjectsMembersModalState>
