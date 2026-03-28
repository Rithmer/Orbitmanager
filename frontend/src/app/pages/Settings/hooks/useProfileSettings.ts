import { useEffect, useRef, useState } from 'react'
import { usersApi } from '@/app/api/users'
import { useAuth } from '@/app/context/useAuth'
import { SETTINGS_PAGE_CONSTANTS } from '@/app/pages/Settings/constants'
import { validateProfileFields } from '@/app/pages/Settings/helpers'

export function useProfileSettings() {
  const { user, refreshUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [profession, setProfession] = useState(user?.profession || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [avatarUrlPreview, setAvatarUrlPreview] = useState<string | null>(user?.avatarUrl ?? null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarUploadError, setAvatarUploadError] = useState('')
  const [avatarUploadSuccess, setAvatarUploadSuccess] = useState('')
  const avatarInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setAvatarUrlPreview(user?.avatarUrl ?? null)
  }, [user?.avatarUrl])

  const saveProfile = async () => {
    if (!user) return
    const validationError = validateProfileFields(fullName, profession)
    if (validationError) {
      setError(validationError)
      setSuccess('')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await usersApi.updateMe({ fullName: fullName.trim(), profession: profession.trim() || undefined })
      await refreshUser()
      setSuccess(SETTINGS_PAGE_CONSTANTS.saveSuccessMessage)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : SETTINGS_PAGE_CONSTANTS.profileSaveErrorMessage)
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatarFile = (file: File | null) => {
    setAvatarUploadError('')
    setAvatarUploadSuccess('')
    if (!file) {
      setAvatarUrlPreview(null)
      return
    }

    const reader = new FileReader()
    reader.onload = async () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      setAvatarUrlPreview(result)
      if (!result || !user) return
      setAvatarUploading(true)
      try {
        await usersApi.updateMe({ avatarUrl: result })
        await refreshUser()
        setAvatarUploadSuccess(SETTINGS_PAGE_CONSTANTS.avatarSuccessMessage)
        setTimeout(() => setAvatarUploadSuccess(''), 3000)
      } catch (err) {
        setAvatarUploadError(err instanceof Error ? err.message : 'Ошибка загрузки аватара')
      } finally {
        setAvatarUploading(false)
      }
    }
    reader.onerror = () => setAvatarUploadError(SETTINGS_PAGE_CONSTANTS.avatarReadErrorMessage)
    reader.readAsDataURL(file)
  }

  return {
    user,
    fullName,
    setFullName,
    profession,
    setProfession,
    saving,
    error,
    success,
    avatarUrlPreview,
    avatarUploading,
    avatarUploadError,
    avatarUploadSuccess,
    avatarInputRef,
    saveProfile,
    uploadAvatarFile,
  }
}
