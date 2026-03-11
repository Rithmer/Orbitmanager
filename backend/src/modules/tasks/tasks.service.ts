import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import type { ITaskRepository } from '../../domain/repositories/task.repository';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import type { IProjectRepository } from '../../domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { IProjectMemberRepository } from '../../domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import type { ITeamMemberRepository } from '../../domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import { Task } from '../../domain/models/task.model';
import { TaskStatus, ALLOWED_TASK_TRANSITIONS } from '../../common/enums/task-status.enum';
import { ProjectRole } from '../../common/enums/project-role.enum';
import { TeamRole } from '../../common/enums/team-role.enum';
import { AccountRole } from '../../common/enums/account-role.enum';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import {
  QueryHelper,
  QueryParams,
  PaginatedResult,
} from '../../common/helpers/query.helper';
import { JsonFileService } from '../../infrastructure/storage/json-file.service';

@Injectable()
export class TasksService {
  constructor(
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    private readonly jsonFileService: JsonFileService,
  ) {}

  // ────────────── Tasks CRUD ──────────────

  async findAll(
    params: QueryParams,
    userId: number,
    userRole: AccountRole,
  ): Promise<PaginatedResult<Task>> {
    let tasks: Task[];

    if (userRole === AccountRole.ADMIN) {
      tasks = await this.taskRepository.findAll();
    } else {
      tasks = await this.getVisibleTasks(userId);
    }

    return QueryHelper.apply(
      tasks as unknown as Record<string, unknown>[],
      { ...params, searchFields: params.searchFields ?? ['name', 'description'] },
    ) as unknown as PaginatedResult<Task>;
  }

  async findById(
    id: number,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException(`Задача #${id} не найдена`);

    if (userRole !== AccountRole.ADMIN) {
      await this.assertTaskVisibility(task, userId);
    }

    return task;
  }

  /**
   * БП1 — Создание задачи:
   * 1. Проверка прав (owner / team_lead)
   * 2. Проверка существования проекта
   * 3. Валидация deadline > now
   * 4. Валидация difficulty 1–5
   * 5. Создание записи с createdById из JWT
   * 6. Запись в audit_logs
   */
  async create(
    dto: CreateTaskDto,
    userId: number,
    userRole: AccountRole,
  ): Promise<Task> {
    // Step 2: check project exists
    const project = await this.projectRepository.findById(dto.projectId);
    if (!project) {
      throw new NotFoundException(`Проект #${dto.projectId} не найден`);
    }

    // Step 1: check permissions (owner / team_lead)
    await this.assertCanCreateTask(project.teamId, dto.projectId, userId, userRole);

    // Step 3: validate deadline > now
    const deadlineDate = new Date(dto.deadline);
    if (deadlineDate <= new Date()) {
      throw new BadRequestException('Дедлайн должен быть в будущем');
    }

    // Step 4: difficulty 1–5 (covered by DTO validation)

    // Validate assigneeId is a project member
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

    // Step 5: create task
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

    // Step 6: audit log
    await this.writeAuditLog(userId, 'create', 'task', task.id, null, null, `Создана задача "${task.name}"`);

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
    if (!project) throw new NotFoundException(`Проект #${task.projectId} не найден`);

    // Status change logic
    if (dto.status && dto.status !== task.status) {
      await this.assertCanChangeStatus(task, dto.status, project.teamId, userId, userRole);
      this.validateStatusTransition(task.status, dto.status);
    } else {
      // For non-status changes: owner or team_lead can edit
      await this.assertCanManageTask(project.teamId, task.projectId, userId, userRole);
    }

    // Validate assigneeId if changing
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

    // Validate deadline if changing
    if (dto.deadline) {
      const deadlineDate = new Date(dto.deadline);
      const createdAtDate = new Date(task.createdAt);
      if (deadlineDate < createdAtDate) {
        throw new BadRequestException('Дедлайн не может быть раньше даты создания задачи');
      }
    }

    const oldStatus = task.status;
    const updated = await this.taskRepository.update(id, {
      ...dto,
      updatedAt: new Date().toISOString(),
    });
    if (!updated) throw new NotFoundException(`Задача #${id} не найдена`);

    // Audit log for status change
    if (dto.status && dto.status !== oldStatus) {
      await this.writeAuditLog(
        userId,
        'status_change',
        'task',
        id,
        oldStatus,
        dto.status,
        `Статус задачи "${task.name}" изменён: ${oldStatus} → ${dto.status}`,
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
    if (!project) throw new NotFoundException(`Проект #${task.projectId} не найден`);

    await this.assertCanManageTask(project.teamId, task.projectId, userId, userRole);

    await this.taskRepository.delete(id);

    await this.writeAuditLog(userId, 'delete', 'task', id, null, null, `Удалена задача "${task.name}"`);
  }

  // ────────────── Helpers ──────────────

  private async getVisibleTasks(userId: number): Promise<Task[]> {
    const teamMemberships = await this.teamMemberRepository.findByUser(userId);
    if (teamMemberships.length === 0) return [];

    const allTasks: Task[] = [];

    for (const tm of teamMemberships) {
      // Get all projects of this team
      const projects = await this.projectRepository.findByTeam(tm.teamId);
      const projectIds = projects.map((p) => p.id);

      if (tm.teamRole === TeamRole.OWNER || tm.teamRole === TeamRole.MEMBER) {
        // See all tasks in all team projects
        for (const pid of projectIds) {
          const tasks = await this.taskRepository.findByProject(pid);
          allTasks.push(...tasks);
        }
      } else if (tm.teamRole === TeamRole.OBSERVER) {
        // See tasks only in assigned projects
        const projectMemberships =
          await this.projectMemberRepository.findByUser(userId);
        const assignedProjectIds = new Set(
          projectMemberships.map((pm) => pm.projectId),
        );
        for (const pid of projectIds) {
          if (assignedProjectIds.has(pid)) {
            const tasks = await this.taskRepository.findByProject(pid);
            allTasks.push(...tasks);
          }
        }
      }
    }

    // Deduplicate
    const seen = new Set<number>();
    return allTasks.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }

  private async assertTaskVisibility(
    task: Task,
    userId: number,
  ): Promise<void> {
    const project = await this.projectRepository.findById(task.projectId);
    if (!project) throw new ForbiddenException('Проект не найден');

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      project.teamId,
    );

    if (!teamMembership) {
      throw new ForbiddenException('Вы не являетесь участником команды');
    }

    if (
      teamMembership.teamRole === TeamRole.OWNER ||
      teamMembership.teamRole === TeamRole.MEMBER
    ) {
      return;
    }

    // observer — check project assignment
    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        project.id,
      );
    if (!projectMembership) {
      throw new ForbiddenException('У вас нет доступа к задачам этого проекта');
    }
  }

  private async assertCanCreateTask(
    teamId: number,
    projectId: number,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    if (accountRole === AccountRole.ADMIN) return;

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      teamId,
    );

    // team owner can create tasks
    if (teamMembership?.teamRole === TeamRole.OWNER) return;

    // team_lead of project can create tasks
    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(userId, projectId);
    if (
      projectMembership &&
      projectMembership.role === ProjectRole.TEAM_LEAD
    ) {
      return;
    }

    throw new ForbiddenException(
      'Только владелец команды или тимлид проекта может создавать задачи',
    );
  }

  private async assertCanManageTask(
    teamId: number,
    projectId: number,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    // Same as create task permissions
    await this.assertCanCreateTask(teamId, projectId, userId, accountRole);
  }

  private async assertCanChangeStatus(
    task: Task,
    newStatus: TaskStatus,
    teamId: number,
    userId: number,
    accountRole: AccountRole,
  ): Promise<void> {
    if (accountRole === AccountRole.ADMIN) return;

    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(
      userId,
      teamId,
    );

    // team owner
    if (teamMembership?.teamRole === TeamRole.OWNER) return;

    // team_lead of project
    const projectMembership =
      await this.projectMemberRepository.findByUserAndProject(
        userId,
        task.projectId,
      );

    if (projectMembership?.role === ProjectRole.TEAM_LEAD) return;

    // developer can change status of their own tasks only
    if (
      projectMembership?.role === ProjectRole.DEVELOPER &&
      task.assigneeId === userId
    ) {
      return;
    }

    throw new ForbiddenException(
      'Нет прав для изменения статуса задачи',
    );
  }

  private validateStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
  ): void {
    const allowed = ALLOWED_TASK_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Недопустимый переход статуса: ${currentStatus} → ${newStatus}. Допустимые: ${allowed?.join(', ') || 'нет'}`,
      );
    }
  }

  private async writeAuditLog(
    userId: number,
    action: string,
    entityType: string,
    entityId: number,
    oldValue: string | null,
    newValue: string | null,
    description: string,
  ): Promise<void> {
    await this.jsonFileService.create('audit_logs', {
      userId,
      action,
      entityType,
      entityId,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
      description,
    });
  }
}
