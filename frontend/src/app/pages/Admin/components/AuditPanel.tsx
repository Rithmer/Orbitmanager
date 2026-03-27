import { Clock, ChevronLeft, ChevronRight, FileText } from 'lucide-react'
import { useTheme } from '@/app/context/useTheme'
import { ErrorMessage } from '@/app/components/Modal'
import { useAdminAuditQuery } from '@/app/features/admin/admin-queries'
import { useSmoothPageSkeleton } from '@/app/hooks/useSmoothPageSkeleton'
import { AuditAction } from '@/app/types'
import { AUDIT_ACTION_LABELS, AUDIT_ENTITY_LABELS, AUDIT_PAGE_SIZE } from '@/app/pages/Admin/constants'
import { useAdminAuditFilters } from '@/app/pages/Admin/hooks/useAdminAuditFilters'

export function AuditPanel({ presetUserId }: { presetUserId: number | null }) {
  const { isDark } = useTheme()
  const { page, setPage, filterAction, setFilterAction, filterEntity, setFilterEntity, filterUserId, setFilterUserId, parsedUserId } =
    useAdminAuditFilters(presetUserId)

  const limit = AUDIT_PAGE_SIZE
  const cardBg = isDark ? 'bg-[#273142]' : 'bg-white'
  const cardBorder = isDark ? 'border-[#313d4f]' : 'border-[#e8e8e8]'
  const textPrimary = isDark ? 'text-[#f4f3f2]' : 'text-[#202224]'
  const textSecondary = isDark ? 'text-[#94a3b8]' : 'text-[#737373]'
  const rowHover = isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-50'

  const auditQuery = useAdminAuditQuery({
    page,
    limit,
    action: filterAction as AuditAction | '',
    entityType: filterEntity,
    userId: parsedUserId,
  })

  const logs = auditQuery.data?.items ?? []
  const total = auditQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const isInitialLoad = auditQuery.isPending && !auditQuery.data
  const isRefreshing = auditQuery.isFetching && !!auditQuery.data
  const showInitialSkeleton = useSmoothPageSkeleton(isInitialLoad)
  const filledRowsCount = logs.length === 0 ? 1 : logs.length
  const emptyRowsCount = showInitialSkeleton ? 0 : Math.max(0, limit - filledRowsCount)

  return (
    <>
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <select value={filterAction} onChange={(e) => { setFilterAction(e.target.value); setPage(1) }} className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}>
          <option value="">Все действия</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([value, { label }]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <select value={filterEntity} onChange={(e) => { setFilterEntity(e.target.value); setPage(1) }} className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`}>
          <option value="">Все сущности</option>
          {Object.entries(AUDIT_ENTITY_LABELS).map(([entity, label]) => <option key={entity} value={entity}>{label}</option>)}
        </select>
        <input value={filterUserId} onChange={(e) => { setFilterUserId(e.target.value); setPage(1) }} placeholder="ID пользователя" className={`px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#1c2534] border-[#313d4f] text-[#f4f3f2]' : 'bg-white border-[#e8e8e8] text-[#202224]'}`} />
      </div>

      {auditQuery.isError && !auditQuery.data && (
        <div className="flex flex-col items-center justify-center py-12 gap-3 mb-4">
          <FileText className="w-8 h-8 text-red-500" />
          <p className={`text-sm font-semibold ${textPrimary}`}>Ошибка загрузки</p>
          <p className={`text-sm ${textSecondary} text-center max-w-md`}>Не удалось загрузить журнал аудита.</p>
          <button onClick={() => auditQuery.refetch()} className="bg-[#4880ff] hover:bg-[#3a6fe0] text-white px-3 py-1.5 rounded-lg text-sm font-semibold">Повторить</button>
        </div>
      )}
      {auditQuery.data && auditQuery.isError && <ErrorMessage message="Не удалось обновить журнал аудита. Показаны предыдущие данные." />}

      <div className={`${cardBg} border ${cardBorder} rounded-xl overflow-hidden`}>
        {isRefreshing && <div className={`px-4 py-2 text-xs font-semibold ${textSecondary} border-b ${cardBorder}`}>Обновление данных...</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px]">
            <thead><tr className={isDark ? 'bg-[#1e2a3a]' : 'bg-[#f0f4f8]'}>{['Время', 'Пользователь', 'Действие', 'Сущность', 'ID', 'Старое', 'Новое', 'Описание'].map((h) => <th key={h} className={`text-left px-4 py-3 text-xs font-bold uppercase tracking-wider ${textSecondary}`}>{h}</th>)}</tr></thead>
            <tbody>
              {showInitialSkeleton ? <AuditTableSkeleton rowCount={8} /> : <>
                {logs.map((log) => {
                  const action = AUDIT_ACTION_LABELS[log.action] || { label: log.action, color: '' }
                  return <tr key={log.id} className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'} ${rowHover}`}>
                    <td className={`px-4 py-3 text-xs ${textSecondary} whitespace-nowrap`}><div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(log.timestamp).toLocaleString('ru-RU')}</div></td>
                    <td className={`px-4 py-3 text-xs ${textPrimary} whitespace-nowrap`}>#{log.userId}</td>
                    <td className="px-4 py-3"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${action.color}`}>{action.label}</span></td>
                    <td className={`px-4 py-3 text-xs ${textPrimary} max-w-[140px]`}><span className="block truncate" title={AUDIT_ENTITY_LABELS[log.entityType] ?? log.entityType}>{AUDIT_ENTITY_LABELS[log.entityType] ?? log.entityType}</span></td>
                    <td className={`px-4 py-3 text-xs ${textSecondary}`}>{log.entityId ?? '—'}</td>
                    <td className={`px-4 py-3 text-xs ${textSecondary} max-w-[120px] truncate`}>{log.oldValue || '—'}</td>
                    <td className={`px-4 py-3 text-xs ${textSecondary} max-w-[120px] truncate`}>{log.newValue || '—'}</td>
                    <td className={`px-4 py-3 text-xs ${textSecondary} max-w-[200px] truncate`}>{log.description || '—'}</td>
                  </tr>
                })}
                {logs.length === 0 && <tr><td colSpan={8} className={`text-center py-8 text-sm ${textSecondary}`}>Записей нет</td></tr>}
                {Array.from({ length: emptyRowsCount }).map((_, idx) => <tr key={`empty-audit-row-${idx}`} className={`border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}><td colSpan={8} className={`px-4 py-3 text-sm ${textSecondary}`}>&nbsp;</td></tr>)}
              </>}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
          <p className={`text-xs ${textSecondary}`}>Показано {(page - 1) * limit + 1}–{Math.min(page * limit, total)} из {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className={`p-1.5 rounded disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}><ChevronLeft className={`w-4 h-4 ${textSecondary}`} /></button>
            <span className={`text-xs font-semibold px-2 ${textPrimary}`}>{page}/{totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={`p-1.5 rounded disabled:opacity-30 ${isDark ? 'hover:bg-[#1c2534]' : 'hover:bg-gray-100'}`}><ChevronRight className={`w-4 h-4 ${textSecondary}`} /></button>
          </div>
        </div>}
      </div>
    </>
  )
}

function AuditTableSkeleton({ rowCount }: { rowCount: number }) {
  return (
    <>
      {Array.from({ length: rowCount }).map((_, index) => (
        <tr key={index} className="border-t border-gray-100">
          <td className="px-4 py-3"><div className="h-4 w-28 rounded bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-6 w-20 rounded-full bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-4 w-12 rounded bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-gray-200/80 skeleton-shimmer" /></td>
          <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-gray-200/80 skeleton-shimmer" /></td>
        </tr>
      ))}
    </>
  )
}
