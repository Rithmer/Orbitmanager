import { useState } from 'react'
import { AlertTriangle, Brain, CheckCircle, RefreshCw, XCircle } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { appQueryKeys } from '@/app/query'
import { riskAdminApi, type MlStatusResponse } from '@/app/api/risk-admin'
import { useTheme } from '@/app/context/useTheme'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'

export function MlModelPanel() {
  const { isDark } = useTheme()
  const queryClient = useQueryClient()
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const [retrainLoading, setRetrainLoading] = useState(false)
  const [retrainResult, setRetrainResult] = useState<{ status: string; message: string } | null>(null)

  const statusQuery = useQuery({
    queryKey: appQueryKeys.admin.mlStatus,
    queryFn: ({ signal }) => riskAdminApi.getMlStatus({ signal }),
    staleTime: 30_000,
  })
  const mlStatus: MlStatusResponse | undefined = statusQuery.data
  const showInitialSkeleton = useSmoothPageSkeleton(statusQuery.isPending && !statusQuery.data)

  const handleRetrain = async () => {
    if (retrainLoading) return
    setRetrainLoading(true)
    setRetrainResult(null)
    try {
      const result = await riskAdminApi.retrain()
      setRetrainResult({ status: result.status, message: result.message })
      await queryClient.invalidateQueries({ queryKey: appQueryKeys.admin.mlStatus })
    } catch (error) {
      setRetrainResult({ status: 'error', message: error instanceof Error ? error.message : 'Ошибка переобучения' })
    } finally {
      setRetrainLoading(false)
    }
  }

  if (statusQuery.isError && !statusQuery.data) {
    return <div className="flex flex-col items-center justify-center py-20 gap-4"><Brain className="w-10 h-10 text-red-500" /><p className={`text-lg font-bold ${textPrimary}`}>Ошибка загрузки</p><p className={`text-sm ${textSecondary} text-center max-w-md`}>Не удалось загрузить состояние прогноза.</p><button onClick={() => statusQuery.refetch()} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold">Повторить</button></div>
  }
  if (showInitialSkeleton) return <MlModelSkeleton />

  const provider = mlStatus?.provider ?? 'unknown'
  const health = mlStatus?.health
  const modelInfo = mlStatus?.modelInfo
  const isOnline = health?.status === 'ok' && health?.model_loaded
  const providerLabel = provider === 'ml' ? 'Умный прогноз' : provider === 'stub' ? 'Базовые правила' : provider
  const providerColor = provider === 'ml' ? 'text-[#4880ff] bg-[#4880ff]/10' : 'text-amber-500 bg-amber-500/10'

  return (
    <div className="space-y-4 page-load-stagger">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}><p className={`text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Текущий режим</p><span className={`text-sm font-semibold px-2.5 py-1 rounded-full ${providerColor}`}>{providerLabel}</span></div>
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}><p className={`text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Состояние прогноза</p>{health ? <div className="flex items-center gap-2">{isOnline ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-amber-500" />}<span className={`text-sm font-semibold ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>{isOnline ? 'Готов к работе' : 'Временно не готов'}</span></div> : <div className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-500" /><span className="text-sm font-semibold text-red-500">Недоступен</span></div>}</div>
        <div className={`${cardBg} border ${cardBorder} rounded-xl p-4`}><p className={`text-xs font-bold uppercase tracking-wider mb-2 ${textSecondary}`}>Версия</p><span className={`text-sm font-semibold ${textPrimary}`}>{health?.version ?? modelInfo?.version ?? '—'}</span></div>
      </div>
      {modelInfo && <div className={`${cardBg} border ${cardBorder} rounded-xl p-5`}><h3 className={`text-sm font-bold mb-4 ${textPrimary}`}>Сведения о прогнозе</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><InfoRow isDark={isDark} label="Последнее обновление" value={modelInfo.trained_at ? new Date(modelInfo.trained_at).toLocaleString('ru-RU') : '—'} /><InfoRow isDark={isDark} label="Объём данных" value={modelInfo.sample_size?.toLocaleString('ru-RU') ?? '—'} /><InfoRow isDark={isDark} label="Факторов учтено" value={String(modelInfo.features.length)} /><InfoRow isDark={isDark} label="Качество прогноза" value={modelInfo.metrics && Object.keys(modelInfo.metrics).length > 0 ? 'Оценка рассчитана' : 'Недостаточно данных'} /></div></div>}
      <div className={`${cardBg} border ${cardBorder} rounded-xl p-5`}>
        <h3 className={`text-sm font-bold mb-3 ${textPrimary}`}>Обновление прогноза</h3>
        <p className={`text-xs mb-4 ${textSecondary}`}>Обновляет прогноз на актуальных данных. Обычно занимает несколько секунд.</p>
        <div className="flex items-center gap-3">
          <button onClick={() => void handleRetrain()} disabled={retrainLoading} className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"><RefreshCw className={`w-4 h-4 ${retrainLoading ? 'animate-spin' : ''}`} />{retrainLoading ? 'Обновление...' : 'Обновить прогноз'}</button>
          {statusQuery.isFetching && !statusQuery.isPending && <span className={`text-xs ${textSecondary}`}>Обновление статуса...</span>}
        </div>
        {retrainResult && <div className={`mt-3 flex items-start gap-2 text-sm ${retrainResult.status === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>{retrainResult.status === 'error' ? <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />}<span>{retrainResult.message}</span></div>}
      </div>
    </div>
  )
}

function InfoRow({ isDark, label, value }: { isDark: boolean; label: string; value: string }) {
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  return <div className="flex items-baseline justify-between gap-2"><span className={`text-xs ${textSecondary}`}>{label}</span><span className={`text-sm font-semibold ${textPrimary}`}>{value}</span></div>
}

function MlModelSkeleton() {
  return <div className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-xl bg-gray-200/80 skeleton-shimmer" />)}</div><div className="h-48 rounded-xl bg-gray-200/80 skeleton-shimmer" /><div className="h-24 rounded-xl bg-gray-200/80 skeleton-shimmer" /></div>
}
