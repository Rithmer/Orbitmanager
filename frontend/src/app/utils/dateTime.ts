function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
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
  const [year, month, day] = dateValue.split('-').map(Number)
  const [hours, minutes] = timeValue.split(':').map(Number)

  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0)).toISOString()
}

export function toLocalEndOfDayIso(dateValue: string): string {
  const [year, month, day] = dateValue.split('-').map(Number)
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
