import { useState } from 'react'
import { ProjectStatus } from '@/app/types'

export function useProjectsProjectFormState() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formTeamId, setFormTeamId] = useState('')
  const [formStatus, setFormStatus] = useState(ProjectStatus.ACTIVE)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [pendingDeleteProjectId, setPendingDeleteProjectId] = useState<number | null>(null)

  return {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    editingProjectId,
    setEditingProjectId,
    formName,
    setFormName,
    formDescription,
    setFormDescription,
    formTeamId,
    setFormTeamId,
    formStatus,
    setFormStatus,
    formLoading,
    setFormLoading,
    formError,
    setFormError,
    pendingDeleteProjectId,
    setPendingDeleteProjectId,
  }
}

export type ProjectsProjectFormState = ReturnType<typeof useProjectsProjectFormState>
