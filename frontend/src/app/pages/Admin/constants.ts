import { Brain, FileText, Users, type LucideIcon } from 'lucide-react'
import { AccountRole, AuditAction, type UserAccountStatus } from '@/app/types'

export type AdminTab = 'users' | 'audit' | 'ml-model'

export const USERS_PAGE_SIZE = 15
export const AUDIT_PAGE_SIZE = 20

export const ADMIN_TABS: Array<{ key: AdminTab; label: string; icon: LucideIcon }> = [
  { key: 'users', label: 'Пользователи', icon: Users },
  { key: 'audit', label: 'Журнал аудита', icon: FileText },
  { key: 'ml-model', label: 'Прогноз', icon: Brain },
]

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  user: 'Пользователь',
  team: 'Команда',
  project: 'Проект',
  task: 'Задача',
  team_member: 'Участник команды',
  project_member: 'Участник проекта',
}

export const AUDIT_ACTION_LABELS: Record<string, { label: string; color: string }> = {
  [AuditAction.CREATE]: { label: 'Создание', color: 'text-emerald-500 bg-emerald-500/10' },
  [AuditAction.UPDATE]: { label: 'Обновление', color: 'text-[#4880ff] bg-[#4880ff]/10' },
  [AuditAction.DELETE]: { label: 'Удаление', color: 'text-red-500 bg-red-500/10' },
  [AuditAction.LOGIN]: { label: 'Вход', color: 'text-purple-500 bg-purple-500/10' },
  [AuditAction.LOGOUT]: { label: 'Выход', color: 'text-[#94a3b8] bg-[#94a3b8]/10' },
  [AuditAction.ASSIGN]: { label: 'Назначение', color: 'text-amber-500 bg-amber-500/10' },
  [AuditAction.STATUS_CHANGE]: { label: 'Смена статуса', color: 'text-orange-500 bg-orange-500/10' },
}

export const ROLE_COLORS: Record<string, string> = {
  [AccountRole.ADMIN]: 'text-red-500 bg-red-500/10',
  [AccountRole.MEMBER]: 'text-[#4880ff] bg-[#4880ff]/10',
  [AccountRole.GUEST]: 'text-gray-500 bg-gray-100',
}

export const STATUS_COLORS: Record<UserAccountStatus, string> = {
  active: 'text-emerald-500 bg-emerald-500/10',
  blocked: 'text-red-500 bg-red-500/10',
}

export const ADMIN_PAGE_CONSTANTS = {
  USERS_PAGE_SIZE,
  AUDIT_PAGE_SIZE,
  ADMIN_TABS,
} as const
