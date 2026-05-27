import type { TaskRiskOutput } from '@/app/types'
import { ProjectStatus } from '@/app/types'
import { TaskStatus } from '@/app/types'

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
  assigneeIds?: number[] | null
  assignees?: ProjectBoardUserSummary[]
  assigneeId?: number | null
  createdById: number
  createdAt: string
  updatedAt: string
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
