import { IsStrongPassword } from 'class-validator';

/** Shared options for user passwords (register, admin create user). */
export const STRONG_PASSWORD_OPTIONS = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
} as const;

export const STRONG_PASSWORD_MESSAGE =
  'Пароль: минимум 8 символов, строчные и прописные буквы, цифра и хотя бы один спецсимвол (!@#$ и т.д.)';

export function StrongPasswordConstraint() {
  return IsStrongPassword(STRONG_PASSWORD_OPTIONS, {
    message: STRONG_PASSWORD_MESSAGE,
  });
}
