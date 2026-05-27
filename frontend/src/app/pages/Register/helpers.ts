import { validatePasswordPolicy } from '@/app/utils/passwordPolicy'
import { REGISTER_PAGE_CONSTANTS } from '@/app/pages/Register/constants'

type RegisterValidationInput = {
  login: string
  password: string
  confirmPassword: string
}

export function validateRegisterForm(input: RegisterValidationInput): string | null {
  if (input.password !== input.confirmPassword) {
    return 'Пароли не совпадают'
  }

  const passwordError = validatePasswordPolicy(input.password)
  if (passwordError) {
    return passwordError
  }

  const normalizedLogin = input.login.trim()
  if (normalizedLogin.length < REGISTER_PAGE_CONSTANTS.minLoginLength) {
    return 'Логин должен быть не менее 3 символов'
  }
  if (!REGISTER_PAGE_CONSTANTS.loginPattern.test(normalizedLogin)) {
    return 'Логин может содержать только буквы, цифры и символ подчёркивания'
  }
  if (normalizedLogin.length > REGISTER_PAGE_CONSTANTS.maxLoginLength) {
    return 'Логин должен быть не более 50 символов'
  }

  return null
}
