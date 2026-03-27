export const REGISTER_PAGE_CONSTANTS = {
  minLoginLength: 3,
  maxLoginLength: 50,
  loginPattern: /^[a-zA-Z0-9_]+$/,
  defaultErrorMessage: 'Ошибка регистрации',
} as const

export const REGISTER_PAGE_FIELDS = [
  { key: 'fullName', label: 'ФИО', placeholder: 'Иванов Иван Иванович', required: true },
  { key: 'login', label: 'Логин', placeholder: 'ivanov', required: true },
  { key: 'profession', label: 'Должность', placeholder: 'Фронтенд-разработчик', required: false },
] as const
