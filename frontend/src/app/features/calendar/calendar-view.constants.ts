export const MONTH_NAMES = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
] as const

export const DAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const

export function buildMonthCells(year: number, month: number) {
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay()
  const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1
  const daysInMonth = new Date(year, month, 0).getDate()
  const cells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = []

  for (let index = 0; index < offset; index += 1) {
    cells.push({ type: 'empty' })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ type: 'day', day })
  }

  return cells
}

export function getLocalMonthTitle(year: number, month: number) {
  return `${MONTH_NAMES[month - 1]} ${year}`
}
