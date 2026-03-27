import { ApiError } from '@/app/api/client'

export function formatFitScore(score: number): string {
  const normalized = Math.max(0, Math.min(1, (score + 1) / 2))
  return `${Math.round(normalized * 100)}%`
}

export function formatImpactLabel(value: number): { label: string; className: string } {
  if (value >= 0.35) return { label: 'Сильно повышает шанс выполнения', className: 'text-emerald-500' }
  if (value >= 0.1) return { label: 'Повышает шанс выполнения', className: 'text-emerald-400' }
  if (value > -0.1) return { label: 'Нейтральное влияние', className: 'text-slate-400' }
  if (value > -0.35) return { label: 'Снижает шанс выполнения', className: 'text-amber-500' }
  return { label: 'Сильно снижает шанс выполнения', className: 'text-red-500' }
}

export function isMlUnavailableError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 503
}

export function formatPercentFromFitScore(score: number): number {
  const normalized = Math.max(0, Math.min(1, (score + 1) / 2))
  return Math.round(normalized * 100)
}

export function getCoordinationRiskExplanation(value: number): string {
  if (value >= 40) return 'Высокая нагрузка на коммуникацию между участниками.'
  if (value >= 20) return 'Есть заметные риски на синхронизации команды.'
  if (value > 0) return 'Низкий риск координации, влияние ограничено.'
  return 'Дополнительного координационного риска не выявлено.'
}
