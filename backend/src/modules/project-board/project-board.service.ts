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
    createdById: number;
    createdAt: Date;
    updatedAt: Date;
    assignees: Array<{
      userId: number;
      user: {
        id: number;
        login: string;
        fullName: string;
        profession: string;
      };
    }>;
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
            createdById: true,
            createdAt: true,
            updatedAt: true,
            assignees: {
              select: {
                userId: true,
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
              assigneeIds: task.assigneeIds,
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
    const assigneeIds = task.assignees.map((a) => a.userId);
    const assignees = task.assignees.map((a) => this.toUserSummary(a.user));
    return {
      id: task.id,
      projectId: task.projectId,
      name: task.name,
      description: task.description,
      deadline: task.deadline.toISOString(),
      status: task.status as TaskStatus,
      difficulty: task.difficulty,
      assigneeIds,
      assignees,
      assigneeId: assigneeIds[0] ?? null,
      createdById: task.createdById,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
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
      task.assigneeIds.length === 0 ||
      task.status === TaskStatus.DONE ||
      task.status === TaskStatus.CANCELLED
    ) {
      continue;
    }

    for (const assigneeId of task.assigneeIds) {
      activeCountsByAssignee.set(
        assigneeId,
        (activeCountsByAssignee.get(assigneeId) ?? 0) + 1,
      );
    }
  }

  const assigneeLoadByTaskId = new Map<number, number>();

  for (const task of tasks) {
    if (task.assigneeIds.length === 0) {
      assigneeLoadByTaskId.set(task.id, 0);
      continue;
    }

    const maxLoad = Math.max(
      ...task.assigneeIds.map((id) =>
        Math.max(0, (activeCountsByAssignee.get(id) ?? 0) - 1),
      ),
    );
    assigneeLoadByTaskId.set(task.id, maxLoad);
  }

  return assigneeLoadByTaskId;
}
