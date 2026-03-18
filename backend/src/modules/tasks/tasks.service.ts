import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma, type Project, type Task } from '@prisma/client';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import {
  ALLOWED_TASK_TRANSITIONS,
  TaskStatus,
} from '@/common/enums/task-status.enum';
import { BusinessException } from '@/common/exceptions/business.exception';
import {
  PaginatedResult,
  buildPaginatedResult,
  normalizePagination,
  parseSortField,
} from '@/common/query/pagination';
import { AuditService } from '../audit-logs/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

export interface TasksListParams {
  search?: string;
  sort?: string;
  page?: number;
  limit?: number;
  projectId?: number;
  status?: string;
  difficulty?: number;
  assigneeId?: number;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  async findAll(
    params: TasksListParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Task>> {
    const pagination = normalizePagination(params.page, params.limit);
    const visibleProjectIds =
      userRole === AccountRole.ADMIN
        ? null
        : await this.projectAccessService.getVisibleProjectIds(userId);

    if (visibleProjectIds && visibleProjectIds.length === 0) {
      return buildPaginatedResult([], 0, pagination.page, pagination.limit);
    }

    const where = this.buildWhere(params, visibleProjectIds);
    const orderBy = this.buildOrderBy(params.sort);

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        orderBy,
        skip: pagination.skip,
        take: pagination.limit,
      }),
    ]);

    return buildPaginatedResult(
      tasks,
      total,
      pagination.page,
      pagination.limit,
    );
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Р—Р°РґР°С‡Р° #${id} РЅРµ РЅР°Р№РґРµРЅР°`);
    }

    if (userRole !== AccountRole.ADMIN) {
      const project = await this.prisma.project.findUnique({
        where: { id: task.projectId },
      });
      if (!project) {
        throw new NotFoundException(`РџСЂРѕРµРєС‚ #${task.projectId} РЅРµ РЅР°Р№РґРµРЅ`);
      }

      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    return task;
  }

  async create(
    dto: CreateTaskDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${dto.projectId} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    await this.projectAccessService.assertTeamOwnerOrProjectLead(
      userId,
      project.teamId,
      dto.projectId,
      userRole,
    );

    const deadlineDate = new Date(dto.deadline);
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('Р”РµРґР»Р°Р№РЅ РґРѕР»Р¶РµРЅ Р±С‹С‚СЊ РІ Р±СѓРґСѓС‰РµРј');
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assigneeMembership = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: dto.projectId,
            userId: dto.assigneeId,
          },
        },
      });
      if (!assigneeMembership) {
        throw new BadRequestException(
          `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.assigneeId} РЅРµ СЏРІР»СЏРµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј РїСЂРѕРµРєС‚Р° #${dto.projectId}`,
        );
      }
    }

    const task = await this.prisma.task.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description ?? '',
        deadline: deadlineDate,
        status: TaskStatus.NEW,
        difficulty: dto.difficulty,
        assigneeId: dto.assigneeId ?? null,
        createdById: userId,
      },
    });

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'task',
      task.id,
      `РЎРѕР·РґР°РЅР° Р·Р°РґР°С‡Р° "${task.name}"`,
    );

    return task;
  }

  async update(
    id: number,
    dto: UpdateTaskDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    const task = await this.findById(id, userId, userRole);
    const project = await this.prisma.project.findUnique({
      where: { id: task.projectId },
    });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${task.projectId} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    if (dto.status && dto.status !== task.status) {
      await this.assertCanChangeStatus(task, project, userId, userRole);
      this.validateStatusTransition(task.status, dto.status);
    } else {
      await this.projectAccessService.assertTeamOwnerOrProjectLead(
        userId,
        project.teamId,
        task.projectId,
        userRole,
      );
    }

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assigneeMembership = await this.prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: dto.assigneeId,
          },
        },
      });
      if (!assigneeMembership) {
        throw new BadRequestException(
          `РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ #${dto.assigneeId} РЅРµ СЏРІР»СЏРµС‚СЃСЏ СѓС‡Р°СЃС‚РЅРёРєРѕРј РїСЂРѕРµРєС‚Р° #${task.projectId}`,
        );
      }
    }

    if (dto.deadline) {
      const deadlineDate = new Date(dto.deadline);
      if (deadlineDate < task.createdAt) {
        throw new BadRequestException(
          'Р”РµРґР»Р°Р№РЅ РЅРµ РјРѕР¶РµС‚ Р±С‹С‚СЊ СЂР°РЅСЊС€Рµ РґР°С‚С‹ СЃРѕР·РґР°РЅРёСЏ Р·Р°РґР°С‡Рё',
        );
      }
    }

    const oldStatus = task.status;
    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.description !== undefined
          ? { description: dto.description }
          : {}),
        ...(dto.deadline !== undefined ? { deadline: new Date(dto.deadline) } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.difficulty !== undefined ? { difficulty: dto.difficulty } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      },
    });

    if (dto.status && dto.status !== oldStatus) {
      await this.auditService.log(
        userId,
        AuditAction.STATUS_CHANGE,
        'task',
        id,
        `РЎС‚Р°С‚СѓСЃ Р·Р°РґР°С‡Рё "${task.name}" РёР·РјРµРЅС‘РЅ: ${oldStatus} в†’ ${dto.status}`,
        oldStatus,
        dto.status,
      );
    }

    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const task = await this.findById(id, userId, userRole);
    const project = await this.prisma.project.findUnique({
      where: { id: task.projectId },
    });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${task.projectId} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    await this.projectAccessService.assertTeamOwnerOrProjectLead(
      userId,
      project.teamId,
      task.projectId,
      userRole,
    );

    await this.prisma.task.delete({ where: { id } });

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'task',
      id,
      `РЈРґР°Р»РµРЅР° Р·Р°РґР°С‡Р° "${task.name}"`,
    );
  }

  private async assertCanChangeStatus(
    task: Task,
    project: Project,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    const canManageTask =
      await this.projectAccessService.hasTeamOwnershipOrProjectLead(
        userId,
        project.teamId,
        task.projectId,
        accountRole,
      );

    if (canManageTask) {
      return;
    }

    const projectMembership = await this.prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId,
        },
      },
    });

    if (
      projectMembership?.role === ProjectRole.DEVELOPER &&
      task.assigneeId === userId
    ) {
      return;
    }

    throw new ForbiddenException('РќРµС‚ РїСЂР°РІ РґР»СЏ РёР·РјРµРЅРµРЅРёСЏ СЃС‚Р°С‚СѓСЃР° Р·Р°РґР°С‡Рё');
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: string,
  ): void {
    const allowed = ALLOWED_TASK_TRANSITIONS[currentStatus as TaskStatus];
    if (!allowed || !allowed.includes(newStatus as TaskStatus)) {
      throw new BusinessException(
        `РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ РїРµСЂРµС…РѕРґ СЃС‚Р°С‚СѓСЃР°: ${currentStatus} в†’ ${newStatus}. Р”РѕРїСѓСЃС‚РёРјС‹Рµ: ${allowed?.join(', ') || 'РЅРµС‚'}`,
      );
    }
  }

  private buildWhere(
    params: TasksListParams,
    visibleProjectIds: number[] | null,
  ): Prisma.TaskWhereInput {
    const where: Prisma.TaskWhereInput = {
      ...(visibleProjectIds ? { projectId: { in: visibleProjectIds } } : {}),
      ...(params.projectId !== undefined ? { projectId: params.projectId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.difficulty !== undefined
        ? { difficulty: params.difficulty }
        : {}),
      ...(params.assigneeId !== undefined
        ? { assigneeId: params.assigneeId }
        : {}),
    };

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private buildOrderBy(sort?: string): Prisma.TaskOrderByWithRelationInput {
    const { field, direction } = parseSortField(
      sort,
      [
        'id',
        'projectId',
        'name',
        'description',
        'deadline',
        'status',
        'difficulty',
        'assigneeId',
        'createdById',
        'createdAt',
        'updatedAt',
      ],
      'id',
    );

    return { [field]: direction };
  }
}
