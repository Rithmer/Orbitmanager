import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { ProjectStatus } from '@/common/enums/project-status.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { RISK_ASSESSMENT_SERVICE, type IRiskAssessmentService } from '@/domain/services/risk-assessment.interface';
import { buildTaskRiskInput } from '@/modules/risk/helpers/build-task-risk-input';
import { AccountRole } from '@/common/enums/account-role.enum';
import type { TaskRiskOutputDto } from '../risk/dto';
import type {
  ProjectBoardMemberDto,
  ProjectBoardProjectDto,
  ProjectBoardTaskDto,
  ProjectBoardUserSummaryDto,
  ProjectBoardViewResponseDto,
} from './project-board.types';

type ProjectBoardRecord = {
  id: number;
  teamId: number;
  name: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  members: Array<{
    id: number;
    userId: number;
    role: string;
    assignedAt: Date;
    user: {
      id: number;
      login: string;
      fullName: string;
      profession: string;
    };
  }>;
  tasks: Array<{
    id: number;
    projectId: number;
    name: string;
    description: string;
    deadline: Date;
    status: string;
    difficulty: number;
    assigneeId: number | null;
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
    assignee: {
      id: number;
      login: string;
      fullName: string;
      profession: string;
    } | null;
  }>;
};

@Injectable()
export class ProjectBoardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
    @Inject(RISK_ASSESSMENT_SERVICE)
    private readonly riskAssessmentService: IRiskAssessmentService,
  ) {}

  async getBoardView(
    projectId: number,
    userId: number,
    accountRole: AccountRole,
  ): Promise<ProjectBoardViewResponseDto> {
    const projectRecord = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        teamId: true,
        name: true,
        description: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        members: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            userId: true,
            role: true,
            assignedAt: true,
            user: {
              select: {
                id: true,
                login: true,
                fullName: true,
                profession: true,
              },
            },
          },
        },
        tasks: {
          orderBy: [{ deadline: 'asc' }, { id: 'asc' }],
          select: {
            id: true,
            projectId: true,
            name: true,
            description: true,
            deadline: true,
            status: true,
            difficulty: true,
            assigneeId: true,
            createdById: true,
            createdAt: true,
            updatedAt: true,
            assignee: {
              select: {
                id: true,
                login: true,
                fullName: true,
                profession: true,
              },
            },
          },
        },
      },
    });

    if (!projectRecord) {
      throw new NotFoundException(`Проект #${projectId} не найден`);
    }

    if (accountRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(
        this.toProjectDomain(projectRecord),
        userId,
      );
    }

    const tasks = projectRecord.tasks.map((task) => this.toTaskDto(task));
    const assigneeLoadByTaskId = buildAssigneeLoadByTaskId(tasks);
    const statusChangesByTaskId = await this.loadStatusChangesByTaskId(
      tasks.map((task) => task.id),
    );

    const riskByTaskEntries = await Promise.all(
      tasks.map(async (task) => {
        const risk = await this.riskAssessmentService.assessTask(
          buildTaskRiskInput(
            {
              id: task.id,
              projectId: task.projectId,
              name: task.name,
              description: task.description,
              deadline: task.deadline,
              status: task.status as TaskStatus,
              difficulty: task.difficulty,
              assigneeId: task.assigneeId,
              createdById: task.createdById,
              createdAt: task.createdAt,
              updatedAt: task.updatedAt,
            },
            statusChangesByTaskId.get(task.id) ?? 0,
            assigneeLoadByTaskId.get(task.id) ?? 0,
          ),
        );

        return [task.id, risk] as const;
      }),
    );

    return {
      project: this.toProjectDto(projectRecord),
      members: projectRecord.members.map((member) => this.toMemberDto(member)),
      tasks,
      riskByTaskId: Object.fromEntries(
        riskByTaskEntries,
      ) as Record<number, TaskRiskOutputDto>,
    };
  }

  private async loadStatusChangesByTaskId(
    taskIds: number[],
  ): Promise<Map<number, number>> {
    if (taskIds.length === 0) {
      return new Map<number, number>();
    }

    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'task',
        entityId: { in: taskIds },
        action: 'status_change',
      },
      select: { entityId: true },
    });

    const statusChangesByTaskId = new Map<number, number>();

    for (const auditLog of auditLogs) {
      if (auditLog.entityId === null) {
        continue;
      }

      statusChangesByTaskId.set(
        auditLog.entityId,
        (statusChangesByTaskId.get(auditLog.entityId) ?? 0) + 1,
      );
    }

    return statusChangesByTaskId;
  }

  private toProjectDto(project: ProjectBoardRecord): ProjectBoardProjectDto {
    return {
      id: project.id,
      teamId: project.teamId,
      name: project.name,
      description: project.description,
      status: project.status,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private toProjectDomain(project: ProjectBoardRecord): {
    id: number;
    teamId: number;
    name: string;
    description: string;
    status: ProjectStatus;
    createdAt: string;
    updatedAt: string;
  } {
    return {
      id: project.id,
      teamId: project.teamId,
      name: project.name,
      description: project.description,
      status: project.status as ProjectStatus,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
    };
  }

  private toMemberDto(
    member: ProjectBoardRecord['members'][number],
  ): ProjectBoardMemberDto {
    return {
      id: member.id,
      userId: member.userId,
      role: member.role as ProjectBoardMemberDto['role'],
      assignedAt: member.assignedAt.toISOString(),
      user: this.toUserSummary(member.user),
    };
  }

  private toTaskDto(task: ProjectBoardRecord['tasks'][number]): ProjectBoardTaskDto {
    return {
      id: task.id,
      projectId: task.projectId,
      name: task.name,
      description: task.description,
      deadline: task.deadline.toISOString(),
      status: task.status as TaskStatus,
      difficulty: task.difficulty,
      assigneeId: task.assigneeId,
      createdById: task.createdById,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
      assignee: task.assignee ? this.toUserSummary(task.assignee) : null,
    };
  }

  private toUserSummary(user: {
    id: number;
    login: string;
    fullName: string;
    profession: string;
  }): ProjectBoardUserSummaryDto {
    return {
      id: user.id,
      login: user.login,
      fullName: user.fullName,
      profession: user.profession,
    };
  }
}

function buildAssigneeLoadByTaskId(
  tasks: ProjectBoardTaskDto[],
): Map<number, number> {
  const activeCountsByAssignee = new Map<number, number>();

  for (const task of tasks) {
    if (
      task.assigneeId === null ||
      task.status === TaskStatus.DONE ||
      task.status === TaskStatus.CANCELLED
    ) {
      continue;
    }

    activeCountsByAssignee.set(
      task.assigneeId,
      (activeCountsByAssignee.get(task.assigneeId) ?? 0) + 1,
    );
  }

  const assigneeLoadByTaskId = new Map<number, number>();

  for (const task of tasks) {
    if (task.assigneeId === null) {
      assigneeLoadByTaskId.set(task.id, 0);
      continue;
    }

    assigneeLoadByTaskId.set(
      task.id,
      Math.max(0, (activeCountsByAssignee.get(task.assigneeId) ?? 0) - 1),
    );
  }

  return assigneeLoadByTaskId;
}
