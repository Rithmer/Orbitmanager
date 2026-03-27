import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '@/app/context/useAuth'
import { LOGIN_PAGE_CONSTANTS } from '@/app/pages/Login/constants'
import { validateLoginForm } from '@/app/pages/Login/helpers'

type LoginFormState = {
  login: string
  password: string
}

const INITIAL_FORM_STATE: LoginFormState = {
  login: '',
  password: '',
}

export function useLoginForm() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState<LoginFormState>(INITIAL_FORM_STATE)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const setLogin = (value: string) => setForm((prev) => ({ ...prev, login: value }))
  const setPassword = (value: string) => setForm((prev) => ({ ...prev, password: value }))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')

    const validationError = validateLoginForm(form.login, form.password)
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    try {
      await login({ login: form.login.trim(), password: form.password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : LOGIN_PAGE_CONSTANTS.defaultErrorMessage)
    } finally {
      setLoading(false)
    }
  }

  return {
    form,
    showPassword,
    error,
    loading,
    setLogin,
    setPassword,
    toggleShowPassword: () => setShowPassword((prev) => !prev),
    handleSubmit,
  }
}
