import { useState } from 'react'
import type { Team } from '@/app/types'

export function useTeamsTeamFormState() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  return {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    editingTeam,
    setEditingTeam,
    formName,
    setFormName,
    formDesc,
    setFormDesc,
    formLoading,
    setFormLoading,
    formError,
    setFormError,
  }
}
