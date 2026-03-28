import type { RefObject } from 'react'
import type { AccountRole } from '@/app/types'

export type SettingsProfileSectionProps = {
  cardBg: string
  cardBorder: string
  dividerColor: string
  sectionIconBg: string
  textPrimary: string
  textSecondary: string
  inputBg: string
  inputText: string
  user: { fullName?: string | null; login?: string | null; accountRole?: AccountRole; avatarUrl?: string | null } | null
  fullName: string
  setFullName: (value: string) => void
  profession: string
  setProfession: (value: string) => void
  saving: boolean
  error: string
  success: string
  avatarUrlPreview: string | null
  avatarUploading: boolean
  avatarUploadError: string
  avatarUploadSuccess: string
  avatarInputRef: RefObject<HTMLInputElement | null>
  onSaveProfile: () => void
  onAvatarFileChange: (file: File | null) => void
}
