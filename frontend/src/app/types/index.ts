export enum AccountRole {
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export enum TeamRole {
  OWNER = 'owner',
  MEMBER = 'member',
  OBSERVER = 'observer',
}

export enum ProjectRole {
  TEAM_LEAD = 'team_lead',
  DEVELOPER = 'developer',
  OBSERVER = 'observer',
}

export enum TaskStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ASSIGN = 'assign',
  STATUS_CHANGE = 'status_change',
}

export const ALLOWED_TASK_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  [TaskStatus.NEW]: [TaskStatus.IN_PROGRESS, TaskStatus.CANCELLED],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.CANCELLED],
  [TaskStatus.REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
  [TaskStatus.DONE]: [],
  [TaskStatus.CANCELLED]: [TaskStatus.NEW],
}

export type UserAccountStatus = 'active' | 'blocked'

export interface User {
  id: number
  login: string
  fullName: string
  profession?: string
  accountStatus: UserAccountStatus
  accountRole: AccountRole
  avatarUrl?: string | null
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: number
  name: string
  description?: string
  createdAt: string
  createdById: number
}

export interface TeamMember {
  id: number
  userId: number
  teamId: number
  teamRole: TeamRole
  user?: User
}

export interface Project {
  id: number
  teamId: number
  name: string
  description?: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  id: number
  projectId: number
  userId: number
  role: ProjectRole
  assignedAt: string
  user?: User
}

export interface Task {
  id: number
  projectId: number
  name: string
  description?: string
  deadline: string
  status: TaskStatus
  difficulty: number
  // Multi-assignees (new contract)
  assigneeIds?: number[] | null
  assignees?: User[]
  // Legacy single-assignee (old contract)
  assigneeId?: number | null
  createdById: number
  createdAt: string
  updatedAt: string
  assignee?: User | null
}

export interface AuditLog {
  id: number
  userId: number
  action: AuditAction
  entityType: string
  entityId?: number | null
  oldValue?: string | null
  newValue?: string | null
  timestamp: string
  description?: string | null
}

export interface TaskRiskOutput {
  predictedCompletionDate: string
  delayProbability: number
  riskLevel: RiskLevel
  riskFactors?: string[]
  recommendation?: string
}

export interface ProjectRiskOutput {
  riskScore: number
  riskLevel: RiskLevel
  tasksAtRisk: { taskId: number; taskName: string; delayProbability: number }[]
  summary: string
}

export interface CalendarEvent {
  id: number
  userId: number
  projectId: number | null
  taskId: number | null
  title: string
  description: string
  startDate: string
  endDate: string
  allDay: boolean
  color: string
  createdAt: string
  updatedAt: string
}

export interface PaginatedResult<T> {
  items: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface LoginDto {
  login: string
  password: string
}

export interface RegisterDto {
  login: string
  password: string
  fullName: string
  profession?: string
}

export type QueryParams = Record<string, string | number | undefined>

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.NEW]: 'Новая',
  [TaskStatus.IN_PROGRESS]: 'В процессе',
  [TaskStatus.REVIEW]: 'Тестирование',
  [TaskStatus.DONE]: 'Выполнена',
  [TaskStatus.CANCELLED]: 'Отменена',
}

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  [ProjectStatus.ACTIVE]: 'Активный',
  [ProjectStatus.ON_HOLD]: 'Приостановлен',
  [ProjectStatus.COMPLETED]: 'Завершён',
  [ProjectStatus.ARCHIVED]: 'Архив',
}

export const ACCOUNT_ROLE_LABELS: Record<AccountRole, string> = {
  [AccountRole.ADMIN]: 'Администратор',
  [AccountRole.MEMBER]: 'Участник',
  [AccountRole.GUEST]: 'Гость',
}

export const TEAM_ROLE_LABELS: Record<TeamRole, string> = {
  [TeamRole.OWNER]: 'Владелец',
  [TeamRole.MEMBER]: 'Участник',
  [TeamRole.OBSERVER]: 'Наблюдатель',
}

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  [ProjectRole.TEAM_LEAD]: 'Тимлид',
  [ProjectRole.DEVELOPER]: 'Разработчик',
  [ProjectRole.OBSERVER]: 'Наблюдатель',
}

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Низкий',
  [RiskLevel.MEDIUM]: 'Средний',
  [RiskLevel.HIGH]: 'Высокий',
}
