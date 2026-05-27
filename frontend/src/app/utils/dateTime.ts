function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

function parseDateParts(dateValue: string): { year: number; month: number; day: number } {
  if (typeof dateValue !== 'string' || dateValue.trim().length === 0) {
    throw new Error(`Invalid date format: "${dateValue}"`)
  }

  const parts = dateValue.split('-')
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: "${dateValue}"`)
  }

  const [year, month, day] = parts.map(Number)
  if (![year, month, day].every((value) => Number.isFinite(value))) {
    throw new Error(`Invalid date format: "${dateValue}"`)
  }

  const parsedDate = new Date(Date.UTC(year, month - 1, day))
  const isValidDate =
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() + 1 === month &&
    parsedDate.getUTCDate() === day

  if (!isValidDate) {
    throw new Error(`Invalid date format: "${dateValue}"`)
  }

  return { year, month, day }
}

function parseTimeParts(timeValue: string): { hours: number; minutes: number } {
  if (typeof timeValue !== 'string' || timeValue.trim().length === 0) {
    throw new Error(`Invalid time format: "${timeValue}"`)
  }

  const parts = timeValue.split(':')
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: "${timeValue}"`)
  }

  const [hours, minutes] = parts.map(Number)
  if (![hours, minutes].every((value) => Number.isFinite(value))) {
    throw new Error(`Invalid time format: "${timeValue}"`)
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: "${timeValue}"`)
  }

  return { hours, minutes }
}

export function formatLocalDateInput(value: Date | string): string {
  const date = toDate(value)
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function formatLocalTimeInput(value: Date | string): string {
  const date = toDate(value)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function toLocalDateTimeIso(
  dateValue: string,
  timeValue = '00:00',
): string {
  const { year, month, day } = parseDateParts(dateValue)
  const { hours, minutes } = parseTimeParts(timeValue)

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0)).toISOString()
}

export function toLocalEndOfDayIso(dateValue: string): string {
  const { year, month, day } = parseDateParts(dateValue)
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)).toISOString()
}

export function isSameLocalDate(
  isoValue: string,
  year: number,
  month: number,
  day: number,
): boolean {
  const date = new Date(isoValue)

  return (
    date.getFullYear() === year &&
    date.getMonth() + 1 === month &&
    date.getDate() === day
  )
}

export function getLocalMonthRangeIso(
  year: number,
  month: number,
): { from: string; to: string } {
  return {
    from: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)).toISOString(),
    to: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)).toISOString(),
  }
}
