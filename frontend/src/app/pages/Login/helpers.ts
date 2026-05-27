import { LOGIN_PAGE_CONSTANTS } from '@/app/pages/Login/constants'

export function validateLoginForm(login: string, password: string): string | null {
  const normalizedLogin = login.trim()

  if (normalizedLogin.length < LOGIN_PAGE_CONSTANTS.minLoginLength) {
    return 'Логин должен быть не менее 3 символов'
  }
  if (normalizedLogin.length > LOGIN_PAGE_CONSTANTS.maxLoginLength) {
    return 'Логин должен быть не более 50 символов'
  }
  if (!LOGIN_PAGE_CONSTANTS.loginPattern.test(normalizedLogin)) {
    return 'Логин может содержать только буквы, цифры и символ подчёркивания'
  }
  if (password.length === 0) {
    return 'Введите пароль'
  }
  if (password.length > LOGIN_PAGE_CONSTANTS.maxPasswordLength) {
    return 'Пароль должен быть не более 100 символов'
  }

  return null
}
