import {
  Injectable,
  Inject,
  Optional,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InMemoryCacheService } from '@/common/cache/in-memory-cache.service';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import {
  ALLOWED_TASK_TRANSITIONS,
  TaskStatus,
} from '@/common/enums/task-status.enum';
import { BusinessException } from '@/common/exceptions/business.exception';
import {
  PaginatedResult,
  QueryParams,
} from '@/common/helpers/query.helper';
import { Task } from '@/domain/models/task.model';
import type { IProjectMemberRepository } from '@/domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '@/domain/repositories/project-member.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { AuditService } from '../audit-logs/audit.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { auditLogCreateInput } from '@/common/helpers/audit-log-prisma.helper';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    private readonly auditService: AuditService,
    private readonly projectAccessService: ProjectAccessService,
    private readonly cache: InMemoryCacheService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Task>> {
    const page = normalizePage(params.page);
    const limit = normalizeLimit(params.limit);
    const projectId =
      typeof params.filters?.['projectId'] === 'number'
        ? (params.filters['projectId'] as number)
        : undefined;
    const status =
      typeof params.filters?.['status'] === 'string'
        ? (params.filters['status'] as string)
        : undefined;
    const difficulty =
      typeof params.filters?.['difficulty'] === 'number'
        ? (params.filters['difficulty'] as number)
        : undefined;
    const assigneeId =
      typeof params.filters?.['assigneeId'] === 'number'
        ? (params.filters['assigneeId'] as number)
        : undefined;

    if (this.taskRepository.findPage) {
      const visibleProjectIds =
        userRole === AccountRole.ADMIN
          ? undefined
          : await this.projectAccessService.getVisibleProjectIds(userId);

      if (visibleProjectIds && visibleProjectIds.length === 0) {
        return toPaginatedResult([], 0, page, limit);
      }

      const result = await this.taskRepository.findPage({
        page,
        limit,
        search: params.search,
        sort: params.sort,
        projectIds: visibleProjectIds,
        projectId,
        status,
        difficulty,
        assigneeId,
      });

      return toPaginatedResult(result.items, result.total, page, limit);
    }

    let tasks: Task[];

    if (userRole === AccountRole.ADMIN) {
      tasks = await this.taskRepository.findAll();
    } else {
      const visibleProjectIds =
        await this.projectAccessService.getVisibleProjectIds(userId);
      tasks =
        visibleProjectIds.length > 0
          ? await this.taskRepository.findByProjects(visibleProjectIds)
          : [];
    }

    return applyInMemoryPagination(
      tasks
        .filter((task) => (projectId !== undefined ? task.projectId === projectId : true))
        .filter((task) => (status ? task.status === status : true))
        .filter((task) => (difficulty !== undefined ? task.difficulty === difficulty : true))
        .filter((task) => (assigneeId !== undefined ? task.assigneeIds.includes(assigneeId) : true))
        .filter((task) => {
          if (!params.search) {
            return true;
          }

          const search = params.search.toLowerCase();
          return [task.name, task.description].some((field) =>
            field.toLowerCase().includes(search),
          );
        }),
      page,
      limit,
    );
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Задача #${id} не найдена`);
    }

    if (userRole !== AccountRole.ADMIN) {
      const project = await this.projectRepository.findById(task.projectId);
      if (!project) {
        throw new NotFoundException(`Проект #${task.projectId} не найден`);
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
    const project = await this.projectRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Проект #${dto.projectId} не найден`);
    }

    await this.projectAccessService.assertTeamOwnerOrProjectLead(
      userId,
      project.teamId,
      dto.projectId,
      userRole,
    );

    const deadlineDate = new Date(dto.deadline);
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('Дедлайн должен быть в будущем');
    }

    const assigneeIds = dto.assigneeIds ?? [];
    for (const assigneeId of assigneeIds) {
      const assigneeMembership =
        await this.projectMemberRepository.findByUserAndProject(
          assigneeId,
          dto.projectId,
        );
      if (!assigneeMembership) {
        throw new BadRequestException(
          `Пользователь #${assigneeId} не является участником проекта #${dto.projectId}`,
        );
      }
    }

    const task = await (this.prisma
      ? this.createWithAuditTransaction(dto, userId, assigneeIds, deadlineDate)
      : this.createViaRepository(dto, userId, assigneeIds));
    this.invalidateUserCaches(userId);
    return task;
  }

  private async createViaRepository(
    dto: CreateTaskDto,
    userId: number,
    assigneeIds: number[],
  ): Promise<Task> {
    const now = new Date().toISOString();
    const task = await this.taskRepository.create({
      projectId: dto.projectId,
      name: dto.name,
      description: dto.description ?? '',
      deadline: dto.deadline,
      status: TaskStatus.NEW,
      difficulty: dto.difficulty,
      assigneeIds,
      createdById: userId,
      createdAt: now,
      updatedAt: now,
    });

    await this.auditService.log(
      userId,
      AuditAction.CREATE,
      'task',
      task.id,
      `Создана задача "${task.name}"`,
    );

    return task;
  }

  private invalidateUserCaches(userId: number): void {
    this.cache.invalidateByPrefix(`dashboard:summary:${userId}:`);
    this.cache.invalidateByPrefix(`reports:summary:${userId}:`);
  }

  private async createWithAuditTransaction(
    dto: CreateTaskDto,
    userId: number,
    assigneeIds: number[],
    deadlineDate: Date,
  ): Promise<Task> {
    const timestamp = new Date();
    const row = await this.prisma!.$transaction(async (tx) => {
      const created = await tx.task.create({
        data: {
          projectId: dto.projectId,
          name: dto.name,
          description: dto.description ?? '',
          deadline: deadlineDate,
          status: TaskStatus.NEW,
          difficulty: dto.difficulty,
          createdById: userId,
          assignees:
            assigneeIds.length > 0
              ? { create: assigneeIds.map((uid) => ({ userId: uid })) }
              : undefined,
        },
        include: { assignees: { select: { userId: true } } },
      });

      await tx.auditLog.create({
        data: auditLogCreateInput(
          userId,
          AuditAction.CREATE,
          'task',
          created.id,
          `Создана задача "${created.name}"`,
          timestamp,
        ),
      });

      return created;
    });

    return {
      id: row.id,
      projectId: row.projectId,
      name: row.name,
      description: row.description,
      deadline: row.deadline.toISOString(),
      status: row.status as TaskStatus,
      difficulty: row.difficulty,
      assigneeIds: row.assignees.map((a) => a.userId),
      createdById: row.createdById,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async update(
    id: number,
    dto: UpdateTaskDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    const task = await this.findById(id, userId, userRole);
    const project = await this.projectRepository.findById(task.projectId);
    if (!project) {
      throw new NotFoundException(`Проект #${task.projectId} не найден`);
    }

    if (dto.status && dto.status !== task.status) {
      await this.assertCanChangeStatus(task, project.teamId, userId, userRole);
      this.validateStatusTransition(task.status, dto.status);
    } else {
      await this.projectAccessService.assertTeamOwnerOrProjectLead(
        userId,
        project.teamId,
        task.projectId,
        userRole,
      );
    }

    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      for (const assigneeId of dto.assigneeIds) {
        const assigneeMembership =
          await this.projectMemberRepository.findByUserAndProject(
            assigneeId,
            task.projectId,
          );
        if (!assigneeMembership) {
          throw new BadRequestException(
            `Пользователь #${assigneeId} не является участником проекта #${task.projectId}`,
          );
        }
      }
    }

    if (dto.deadline) {
      const deadlineDate = new Date(dto.deadline);
      const createdAtDate = new Date(task.createdAt);
      if (deadlineDate < createdAtDate) {
        throw new BadRequestException(
          'Дедлайн не может быть раньше даты создания задачи',
        );
      }
    }

    const oldStatus = task.status;
    const updated = await this.taskRepository.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) {
      throw new NotFoundException(`Задача #${id} не найдена`);
    }

    if (dto.status && dto.status !== oldStatus) {
      await this.auditService.log(
        userId,
        AuditAction.STATUS_CHANGE,
        'task',
        id,
        `Статус задачи "${task.name}" изменён: ${oldStatus} → ${dto.status}`,
        oldStatus,
        dto.status,
      );
    }

    this.invalidateUserCaches(userId);
    return updated;
  }

  async remove(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<void> {
    const task = await this.findById(id, userId, userRole);
    const project = await this.projectRepository.findById(task.projectId);
    if (!project) {
      throw new NotFoundException(`Проект #${task.projectId} не найден`);
    }

    await this.projectAccessService.assertTeamOwnerOrProjectLead(
      userId,
      project.teamId,
      task.projectId,
      userRole,
    );

    await this.taskRepository.delete(id);

    await this.auditService.log(
      userId,
      AuditAction.DELETE,
      'task',
      id,
      `Удалена задача "${task.name}"`,
    );

    this.invalidateUserCaches(userId);
  }

  private async assertCanChangeStatus(
    task: Task,
    teamId: number,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    const canManageTask =
      await this.projectAccessService.hasTeamOwnershipOrProjectLead(
        userId,
        teamId,
        task.projectId,
        accountRole,
      );

    if (canManageTask) {
      return;
    }

    if (task.assigneeIds.includes(userId)) {
      return;
    }

    throw new ForbiddenException('Нет прав для изменения статуса задачи');
  }

  private validateStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
  ): void {
    const allowed = ALLOWED_TASK_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BusinessException(
        `Недопустимый переход статуса: ${currentStatus} → ${newStatus}. Допустимые: ${allowed?.join(', ') || 'нет'}`,
      );
    }
  }
}

function normalizePage(page: number | undefined): number {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.max(1, Math.trunc(page as number));
}

function normalizeLimit(limit: number | undefined): number {
  if (!Number.isFinite(limit)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.trunc(limit as number)));
}

function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

function applyInMemoryPagination<T>(
  items: T[],
  page: number,
  limit: number,
): PaginatedResult<T> {
  const offset = (page - 1) * limit;
  return toPaginatedResult(items.slice(offset, offset + limit), items.length, page, limit);
}
