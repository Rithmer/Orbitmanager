import type { AccountRole } from '@/common/enums/account-role.enum'
import type { ProjectRole } from '@/common/enums/project-role.enum'
import type { RiskLevel } from '@/common/enums/risk-level.enum'
import type { TaskStatus } from '@/common/enums/task-status.enum'
import type { TaskRiskOutputDto } from '@/modules/risk/dto'

export interface ProjectBoardUserSummaryDto {
  id: number
  login: string
  fullName: string
  profession: string
}

export interface ProjectBoardMemberDto {
  id: number
  userId: number
  role: ProjectRole
  assignedAt: string
  user: ProjectBoardUserSummaryDto
}

export interface ProjectBoardProjectDto {
  id: number
  teamId: number
  name: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ProjectBoardTaskDto {
  id: number
  projectId: number
  name: string
  description: string
  deadline: string
  difficulty: number
  status: TaskStatus
  assigneeIds: number[]
  assignees: ProjectBoardUserSummaryDto[]
  /** @deprecated обратная совместимость — первый исполнитель или null */
  assigneeId: number | null
  createdById: number
  createdAt: string
  updatedAt: string
}

export interface ProjectBoardViewResponseDto {
  project: ProjectBoardProjectDto
  members: ProjectBoardMemberDto[]
  tasks: ProjectBoardTaskDto[]
  riskByTaskId: Record<number, TaskRiskOutputDto>
}

export interface ProjectBoardViewQueryContext {
  userId: number
  accountRole: AccountRole
}
