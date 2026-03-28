import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/context/useAuth'
import { REGISTER_PAGE_CONSTANTS } from '@/app/pages/Register/constants'
import { validateRegisterForm } from '@/app/pages/Register/helpers'

type RegisterFormState = {
  login: string
  password: string
  confirmPassword: string
  fullName: string
  profession: string
}

const INITIAL_FORM_STATE: RegisterFormState = {
  login: '',
  password: '',
  confirmPassword: '',
  fullName: '',
  profession: '',
}

export function useRegisterForm() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<RegisterFormState>(INITIAL_FORM_STATE)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setField = <K extends keyof RegisterFormState>(key: K, value: RegisterFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    const validationError = validateRegisterForm({
      login: form.login,
      password: form.password,
      confirmPassword: form.confirmPassword,
    })
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await register({
        login: form.login.trim(),
        password: form.password,
        fullName: form.fullName,
        profession: form.profession || undefined,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : REGISTER_PAGE_CONSTANTS.defaultErrorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    showPassword,
    error,
    loading,
    setField,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    handleSubmit,
  }
}
