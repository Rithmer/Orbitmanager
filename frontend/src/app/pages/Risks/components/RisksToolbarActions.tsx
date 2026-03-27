import { RefreshCw } from 'lucide-react'
import { RefreshBadge } from '@/app/components/PageShell'

type RisksToolbarActionsProps = {
  isRefreshing: boolean
  onRefresh: () => void
}

export function RisksToolbarActions({ isRefreshing, onRefresh }: RisksToolbarActionsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {isRefreshing ? <RefreshBadge isRefreshing label="Обновляем риски" /> : null}
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
      >
        <RefreshCw className="w-4 h-4" />
        Обновить
      </button>
    </div>
  )
}
