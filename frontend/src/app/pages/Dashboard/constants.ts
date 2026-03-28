import { AuditAction } from '@/app/types'

export const DASHBOARD_PAGE_CONSTANTS = {
  welcomeFallbackName: 'Пользователь',
  shellDescriptionLoading: 'Подготавливаем сводку по задачам, проектам и рискам.',
  shellDescriptionError: 'Не удалось загрузить сводку.',
  refreshFailedMessage: 'Не удалось обновить данные. Показаны сохранённые значения.',
  taskEmptyMessage: 'Задач пока нет. Создайте проект и добавьте задачи.',
  auditEmptyMessage: 'Действий пока нет.',
  risksEmptyMessage: 'Данные о рисках появятся после создания задач с дедлайнами.',
  loadErrorFallbackMessage: 'Не удалось загрузить данные. Попробуйте обновить страницу.',
} as const

export const DASHBOARD_AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  [AuditAction.CREATE]: 'Создание',
  [AuditAction.UPDATE]: 'Изменение',
  [AuditAction.DELETE]: 'Удаление',
  [AuditAction.LOGIN]: 'Вход',
  [AuditAction.LOGOUT]: 'Выход',
  [AuditAction.ASSIGN]: 'Назначение',
  [AuditAction.STATUS_CHANGE]: 'Смена статуса',
}
