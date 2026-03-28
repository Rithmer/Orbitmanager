import { createPortal } from 'react-dom'
import { CalendarDays, Clock, Edit3, Plus, Tag, Trash2, X } from 'lucide-react'
import { TASK_STATUS_LABELS, TaskStatus } from '@/app/types'
import { CALENDAR_PAGE_CONSTANTS } from '@/app/pages/Calendar/constants'
import type { SelectedDayModalProps } from '@/app/pages/Calendar/types'

export function SelectedDayModal(props: SelectedDayModalProps) {
  const {
    selectedDay,
    currentMonth,
    currentYear,
    selectedDayItems,
    canManageCalendar,
    isDark,
    modalBg,
    textPrimary,
    textSecondary,
    getDayOfWeek,
    isToday,
    getEventColorById,
    onClose,
    onCreateForDay,
    onEditEvent,
    onDeleteEvent,
  } = props

  if (selectedDay === null) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 modal-overlay-enter" onClick={onClose}>
      <div className={`${modalBg} rounded-2xl shadow-2xl w-full max-w-md overflow-hidden modal-content-enter`} onClick={(e) => e.stopPropagation()}>
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-[#313d4f]' : 'border-gray-100'}`}>
          <div>
            <h2 className={`font-bold text-lg ${textPrimary}`}>{selectedDay} {CALENDAR_PAGE_CONSTANTS.MONTHS[currentMonth - 1]}</h2>
            <p className={`text-sm capitalize ${textSecondary}`}>
              {getDayOfWeek(selectedDay)}
              {isToday(currentYear, currentMonth, selectedDay) ? <span className="ml-2 text-[10px] font-bold bg-[#4880ff] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Сегодня</span> : null}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canManageCalendar ? (
              <button onClick={() => onCreateForDay(selectedDay)} className="p-2 rounded-lg bg-[#4880ff] text-white hover:bg-[#3a6fe0] transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            ) : null}
            <button onClick={onClose} className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-[#1c2534] text-[#94a3b8]' : 'hover:bg-gray-100 text-gray-400'}`}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {selectedDayItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                <Clock className={`w-6 h-6 ${textSecondary}`} />
              </div>
              <p className={`text-sm font-semibold ${textSecondary}`}>Нет событий</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayItems.map((item) => (
                <div key={item.id} className={`flex gap-3 p-3 md:p-4 rounded-xl ${isDark ? 'bg-[#1c2534]' : 'bg-gray-50'}`}>
                  <div className={`w-1 rounded-full shrink-0 ${item.type === 'task' ? item.color : ''}`} style={item.type === 'event' ? { backgroundColor: getEventColorById(item.eventId) } : undefined} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {item.type === 'event' ? <CalendarDays className="w-3 h-3 text-[#4880ff] shrink-0" /> : <Tag className="w-3 h-3 text-amber-500 shrink-0" />}
                        <p className={`font-semibold text-sm ${textPrimary} truncate`}>{item.title}</p>
                      </div>
                      {item.type === 'task' && item.status ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${item.color} ${item.textColor}`}>{TASK_STATUS_LABELS[item.status as TaskStatus] || item.status}</span> : null}
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-xs ${textSecondary}`}>{item.time}</span>
                      {item.duration ? <span className={`text-xs ${textSecondary} flex items-center gap-1`}><Clock className="w-3 h-3" /> {item.duration}</span> : null}
                    </div>
                    {item.type === 'event' && canManageCalendar && item.eventId ? (
                      <div className="flex items-center gap-1 mt-2">
                        <button onClick={(e) => { e.stopPropagation(); onEditEvent(item.eventId!) }} className="p-1 rounded hover:bg-[#4880ff]/10 text-[#4880ff] transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDeleteEvent(item.eventId!) }} className="p-1 rounded hover:bg-red-500/10 text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
