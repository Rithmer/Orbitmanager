import { useState } from 'react'
import { authApi } from '@/app/api/auth'
import { SETTINGS_PAGE_CONSTANTS } from '@/app/pages/Settings/constants'

export function usePasswordSettings() {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [changePasswordLoading, setChangePasswordLoading] = useState(false)
  const [changePasswordError, setChangePasswordError] = useState('')
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('')

  const togglePasswordForm = () => {
    setIsChangePasswordOpen((prev) => !prev)
    setChangePasswordError('')
    setChangePasswordSuccess('')
  }

  const changePassword = async () => {
    setChangePasswordError('')
    setChangePasswordSuccess('')
    if (!currentPassword.trim()) return setChangePasswordError('Введите текущий пароль')
    if (!newPassword.trim()) return setChangePasswordError('Введите новый пароль')
    if (newPassword.length < 8) return setChangePasswordError('Новый пароль должен быть не менее 8 символов')
    if (newPassword !== confirmNewPassword) return setChangePasswordError('Подтверждение пароля не совпадает')

    setChangePasswordLoading(true)
    try {
      await authApi.changePassword({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setChangePasswordSuccess(SETTINGS_PAGE_CONSTANTS.passwordChangeSuccessMessage)
      setTimeout(() => setChangePasswordSuccess(''), 3000)
      setIsChangePasswordOpen(false)
    } catch (err) {
      setChangePasswordError(err instanceof Error ? err.message : SETTINGS_PAGE_CONSTANTS.passwordChangeErrorMessage)
    } finally {
      setChangePasswordLoading(false)
    }
  }

  return {
    isChangePasswordOpen,
    currentPassword,
    newPassword,
    confirmNewPassword,
    changePasswordLoading,
    changePasswordError,
    changePasswordSuccess,
    setCurrentPassword,
    setNewPassword,
    setConfirmNewPassword,
    togglePasswordForm,
    changePassword,
  }
}
