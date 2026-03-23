import type { TaskRiskOutput } from '../../types'
import { ProjectStatus } from '../../types'
import { TaskStatus } from '../../types'

export interface ProjectBoardUserSummary {
  id: number
  login: string
  fullName: string
  profession: string
}

export interface ProjectBoardMember {
  id: number
  userId: number
  role: string
  assignedAt: string
  user: ProjectBoardUserSummary
}

export interface ProjectBoardTask {
  id: number
  projectId: number
  name: string
  description: string
  deadline: string
  status: TaskStatus
  difficulty: number
  // Multi-assignees (new contract)
  assigneeIds?: number[] | null
  assignees?: ProjectBoardUserSummary[]
  // Legacy single-assignee (old contract)
  assigneeId?: number | null
  createdById: number
  createdAt: string
  updatedAt: string
  // Legacy single-assignee summary (old contract)
  assignee?: ProjectBoardUserSummary | null
}

export interface ProjectBoardProject {
  id: number
  teamId: number
  name: string
  description: string
  status: ProjectStatus
  createdAt: string
  updatedAt: string
}

export interface ProjectBoardView {
  project: ProjectBoardProject
  members: ProjectBoardMember[]
  tasks: ProjectBoardTask[]
  riskByTaskId: Record<number, TaskRiskOutput>
}
