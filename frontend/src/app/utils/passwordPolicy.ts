const PASSWORD_SYMBOL_CHAR_RE =
  /^[-#!$@£%^&*()_+|~=`{}[\]:";'<>?,./\\ ]$/

export const PASSWORD_POLICY_HINT =
  'Минимум 8 символов: строчные и прописные латинские буквы, цифра и спецсимвол (!@#$% и т.д.)'

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) {
    return 'Пароль должен быть не менее 8 символов'
  }
  if (password.length > 100) {
    return 'Пароль не должен превышать 100 символов'
  }
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return PASSWORD_POLICY_HINT
  }
  if (!Array.from(password).some((ch) => PASSWORD_SYMBOL_CHAR_RE.test(ch))) {
    return PASSWORD_POLICY_HINT
  }
  return null
}
