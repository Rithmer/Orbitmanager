import { ArrowLeft, LoaderCircle, Plus } from 'lucide-react'
import type { BoardPageActionsProps } from '@/app/pages/Board/types'

export function BoardPageActions({
  isDark,
  viewMode,
  onToggleViewMode,
  isRefreshing,
  onRefresh,
  canEditTasks,
  onCreateTask,
  onOpenProjectPicker,
}: BoardPageActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={onOpenProjectPicker}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors ${
          isDark
            ? 'border-[#313d4f] text-[#f4f3f2] hover:bg-[#273142]'
            : 'border-gray-200 text-[#202224] hover:bg-gray-50'
        }`}
      >
        <ArrowLeft className="h-4 w-4" />
        Выбор проектов
      </button>
      <div
        className={`relative inline-flex h-10 items-stretch overflow-hidden rounded-lg border text-xs font-medium shadow-sm ${
          isDark ? 'border-[#313d4f] bg-[#0b1120]' : 'border-gray-200 bg-white'
        }`}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1 top-1 bottom-1 z-0 w-[calc(50%-8px)] rounded-md bg-[#4880ff] shadow-sm"
          style={{
            transform:
              viewMode === 'board' ? 'translate3d(0, 0, 0)' : 'translate3d(calc(100% + 8px), 0, 0)',
            transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-1 text-center transition-colors ${
            viewMode === 'board' ? 'text-white' : isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
          }`}
        >
          Канбан
        </button>
        <button
          type="button"
          onClick={onToggleViewMode}
          className={`relative z-10 flex min-h-0 flex-1 items-center justify-center px-3 py-1 text-center transition-colors ${
            viewMode === 'list' ? 'text-white' : isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
          }`}
        >
          Список
        </button>
      </div>
      <button
        onClick={onRefresh}
        disabled={isRefreshing}
        className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-70 ${
          isDark
            ? 'border-[#313d4f] text-[#94a3b8] hover:text-[#f4f3f2] hover:bg-[#273142]'
            : 'border-gray-200 text-[#737373] hover:bg-gray-50'
        }`}
      >
        {isRefreshing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
        Обновить
      </button>
      {canEditTasks && (
        <button
          onClick={onCreateTask}
          className="inline-flex items-center gap-2 rounded-lg bg-[#4880ff] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#3a6fe0]"
        >
          <Plus className="h-4 w-4" />
          Добавить задачу
        </button>
      )}
    </div>
  )
}
