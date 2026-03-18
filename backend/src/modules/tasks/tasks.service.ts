import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import {
  ALLOWED_TASK_TRANSITIONS,
  TaskStatus,
} from '@/common/enums/task-status.enum';
import { BusinessException } from '@/common/exceptions/business.exception';
import type {
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
  ) {}

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Task>> {
    if (userRole === AccountRole.ADMIN) {
      return this.taskRepository.findPaginated({
        ...params,
        searchFields: params.searchFields ?? ['name', 'description'],
      });
    }

    const visibleProjectIds =
      await this.projectAccessService.getVisibleProjectIds(userId);
    if (visibleProjectIds.length === 0) {
      return { items: [], total: 0, page: 1, limit: params.limit ?? 20, totalPages: 1 };
    }

    return this.taskRepository.findPaginated(
      {
        ...params,
        searchFields: params.searchFields ?? ['name', 'description'],
      },
      visibleProjectIds,
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

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assigneeMembership =
        await this.projectMemberRepository.findByUserAndProject(
          dto.assigneeId,
          dto.projectId,
        );
      if (!assigneeMembership) {
        throw new BadRequestException(
          `Пользователь #${dto.assigneeId} не является участником проекта #${dto.projectId}`,
        );
      }
    }

    const now = new Date().toISOString();
    const task = await this.taskRepository.create({
      projectId: dto.projectId,
      name: dto.name,
      description: dto.description ?? '',
      deadline: dto.deadline,
      status: TaskStatus.NEW,
      difficulty: dto.difficulty,
      assigneeId: dto.assigneeId ?? null,
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

    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assigneeMembership =
        await this.projectMemberRepository.findByUserAndProject(
          dto.assigneeId,
          task.projectId,
        );
      if (!assigneeMembership) {
        throw new BadRequestException(
          `Пользователь #${dto.assigneeId} не является участником проекта #${task.projectId}`,
        );
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

    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        task.projectId,
      );

    if (
      projectMembership?.role === ProjectRole.DEVELOPER &&
      task.assigneeId === userId
    ) {
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
