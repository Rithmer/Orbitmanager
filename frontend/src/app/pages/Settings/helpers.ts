export function validateProfileFields(fullName: string, profession: string): string | null {
  const normalizedFullName = fullName.trim()
  const normalizedProfession = profession.trim()

  if (!normalizedFullName) return 'ФИО обязательно'
  if (normalizedFullName.length < 3) return 'ФИО должно быть не менее 3 символов'
  if (normalizedFullName.length > 100) return 'ФИО должно быть не более 100 символов'
  if (normalizedProfession.length > 100) return 'Должность должна быть не более 100 символов'
  return null
}

export function abbreviateFullName(name?: string | null): string {
  const full = (name ?? '').trim()
  if (!full) return ''
  const parts = full.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return full

  const lastName = parts[0]
  const initials = parts
    .slice(1, 3)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(' ')

  return `${lastName} ${initials}`
}
