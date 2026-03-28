export const LOGIN_PAGE_CONSTANTS = {
  minLoginLength: 3,
  maxLoginLength: 50,
  maxPasswordLength: 100,
  loginPattern: /^[a-zA-Z0-9_]+$/,
  defaultErrorMessage: 'Ошибка входа',
} as const
