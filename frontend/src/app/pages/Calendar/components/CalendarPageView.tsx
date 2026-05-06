import type { CalendarPageViewModel } from '@/app/pages/Calendar/types'
import { CalendarPageBody } from '@/app/pages/Calendar/components/CalendarPageBody'
import { CalendarPageErrorState } from '@/app/pages/Calendar/components/CalendarPageErrorState'
import { CalendarPageLoadingState } from '@/app/pages/Calendar/components/CalendarPageLoadingState'
import { EventFormModal, SelectedDayModal } from '@/app/pages/Calendar/components/CalendarModals'

type CalendarPageViewProps = {
  model: CalendarPageViewModel
}

export function CalendarPageView({ model }: CalendarPageViewProps) {
  if (model.phase === 'loading') {
    return <CalendarPageLoadingState pageBg={model.tokens.pageBg} />
  }

  if (model.phase === 'error') {
    return <CalendarPageErrorState tokens={model.tokens} error={model.error} onRetry={model.onRetry} />
  }

  const { ui, form } = model
  const isEditEventForm = form.showEditModal
  const eventFormOpen = form.showCreateModal || form.showEditModal

  return (
    <div className={`${ui.pageBg} min-h-full p-4 md:p-8 page-load-stagger`}>
      <CalendarPageBody model={model} />
      <SelectedDayModal
        ui={ui}
        selectedDay={model.selectedDay}
        currentMonth={model.currentMonth}
        currentYear={model.currentYear}
        selectedDayItems={model.selectedDayItems}
        canManageCalendar={model.canManageCalendar}
        getDayOfWeek={model.getDayOfWeek}
        isToday={model.isToday}
        getEventColorById={model.getEventColorById}
        onClose={() => model.setSelectedDay(null)}
        onCreateForDay={form.openCreateForDay}
        onEditEvent={form.openEditEvent}
        onDeleteEvent={form.handleDeleteEvent}
      />
      <EventFormModal
        open={eventFormOpen}
        title={isEditEventForm ? 'Редактировать событие' : 'Новое событие'}
        submitLabel={isEditEventForm ? 'Сохранить' : 'Создать'}
        ui={ui}
        resetSessionId={isEditEventForm ? form.editSessionId : form.createSessionId}
        initialValues={isEditEventForm ? form.editInitial : form.createInitial}
        projectOptions={model.projectOptions}
        onClose={() => {
          if (form.showEditModal) {
            form.setShowEditModal(false)
            form.setEditingEvent(null)
            return
          }
          form.setShowCreateModal(false)
        }}
        onSubmit={isEditEventForm ? form.submitEdit : form.submitCreate}
      />
    </div>
  )
}
