export function formatBoardDateLabel(value: string) {
  return new Date(value).toLocaleDateString('ru-RU')
}

export function formatBoardDateTimeLabel(value: string) {
  return new Date(value).toLocaleString('ru-RU')
}

export function formatBoardShortDate(value: string) {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
}
