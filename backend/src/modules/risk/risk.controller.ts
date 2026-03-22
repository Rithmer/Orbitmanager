import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type { AuditLog } from '@/domain/models/audit-log.model';
import type { Project } from '@/domain/models/project.model';
import type { Task } from '@/domain/models/task.model';
import type { IAuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import type { IRiskAssessmentService } from '@/domain/services/risk-assessment.interface';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
import { ReadModelResponseFactory } from '@/common/read-models/read-model-response.factory';
import { ProjectRiskOutputDto, TaskRiskOutputDto } from './dto';
import { buildTaskRiskInput } from './helpers/build-task-risk-input';

@ApiTags('Risk Assessment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccountRolesGuard)
@Controller()
export class RiskController {
  constructor(
    @Inject(RISK_ASSESSMENT_SERVICE)
    private readonly riskService: IRiskAssessmentService,
    @Inject(TASK_REPOSITORY)
    private readonly taskRepository: ITaskRepository,
    @Inject(PROJECT_REPOSITORY)
    private readonly projectRepository: IProjectRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly projectAccessService: ProjectAccessService,
    private readonly readModelResponseFactory: ReadModelResponseFactory,
  ) {}

  @Get('tasks/:id/risk')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Оценка рисков задачи' })
  @ApiResponse({
    status: 200,
    description: 'Оценка рисков задачи',
    type: TaskRiskOutputDto,
  })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiResponse({ status: 403, description: 'Нет доступа к задаче' })
  async getTaskRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<TaskRiskOutputDto> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundException(`Задача #${id} не найдена`);
    }

    const project = await this.projectRepository.findById(task.projectId);
    if (!project) {
      throw new NotFoundException(`Проект #${task.projectId} не найден`);
    }

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    const [auditLogs, allTasks] = await Promise.all([
      this.auditLogRepository.findByEntity('task', task.id),
      this.taskRepository.findByProject(task.projectId),
    ]);

    const statusChangesCount = auditLogs.filter(
      (log) => log.action === AuditAction.STATUS_CHANGE,
    ).length;

    const assigneeLoad =
      task.assigneeIds.length > 0
        ? Math.max(
            ...task.assigneeIds.map((uid) =>
              allTasks.filter(
                (candidate) =>
                  candidate.assigneeIds.includes(uid) &&
                  candidate.status !== TaskStatus.DONE &&
                  candidate.status !== TaskStatus.CANCELLED &&
                  candidate.id !== task.id,
              ).length,
            ),
          )
        : 0;

    const input = buildTaskRiskInput(task, statusChangesCount, assigneeLoad);

    return this.riskService.assessTask(input);
  }

  @Get('projects/:id/risk')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Оценка рисков проекта (БП3: Мониторинг)' })
  @ApiResponse({
    status: 200,
    description: 'Оценка рисков проекта',
    type: ProjectRiskOutputDto,
  })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @ApiResponse({ status: 403, description: 'Нет доступа к проекту' })
  async getProjectRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<ProjectRiskOutputDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Проект #${id} не найден`);
    }

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    return this.riskService.assessProject(id);
  }

  @Get('projects/:id/tasks-risk')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Оценка рисков всех задач проекта (пакетный)' })
  @ApiResponse({ status: 200, description: 'Риски всех задач проекта' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  async getProjectTasksRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<Record<number, TaskRiskOutputDto>> {
    const project = await this.projectRepository.findById(id);
    if (!project) {
      throw new NotFoundException(`Проект #${id} не найден`);
    }

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    const allTasks = await this.taskRepository.findByProject(id);
    if (allTasks.length === 0) return {};

    const taskIds = allTasks.map((t) => t.id);
    const auditLogs =
      await this.auditLogRepository.findByEntityIds('task', taskIds);
    const statusChangesByTaskId = buildStatusChangeMap(auditLogs);
    const assigneeLoadByTaskId = buildAssigneeLoadMap(allTasks);

    const result: Record<number, TaskRiskOutputDto> = {};
    for (const task of allTasks) {
      const input = buildTaskRiskInput(
        task,
        statusChangesByTaskId.get(task.id) ?? 0,
        assigneeLoadByTaskId.get(task.id) ?? 0,
      );
      result[task.id] = await this.riskService.assessTask(input);
    }

    return result;
  }

  @Get('risks/projects')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiQuery({
    name: 'projectIds',
    required: false,
    type: String,
    description: 'Comma-separated list of project ids',
  })
  @ApiOperation({
    summary: 'Оценка рисков всех видимых проектов (пакетный)',
  })
  @ApiResponse({ status: 200, description: 'Риски проектов' })
  async getAllProjectsRisk(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('projectIds') projectIdsParam?: string | string[],
    @Query('ids') legacyIds?: string | string[],
  ): Promise<Record<number, ProjectRiskOutputDto>> {
    const requestedProjectIds = this.readModelResponseFactory.normalizeIds(
      projectIdsParam ?? legacyIds,
    );
    let projects: Project[];

    if (projectIdsParam === undefined && legacyIds === undefined) {
      projects =
        userRole === AccountRole.ADMIN
          ? await this.projectRepository.findAll()
          : await this.projectAccessService.getVisibleProjects(userId);
    } else {
      if (requestedProjectIds.length === 0) {
        return {};
      }

      if (userRole === AccountRole.ADMIN && this.projectRepository.findByIds) {
        projects = await this.projectRepository.findByIds(requestedProjectIds);
      } else {
        const visibleProjects = await this.projectAccessService.getVisibleProjects(
          userId,
        );
        const requestedProjectIdSet = new Set(requestedProjectIds);
        projects = visibleProjects.filter((project) =>
          requestedProjectIdSet.has(project.id),
        );
      }
    }

    if (projects.length === 0) {
      return {};
    }

    const selectedProjectIds = projects.map((project) => project.id);
    const tasks = await this.taskRepository.findByProjects(selectedProjectIds);
    const taskIds = tasks.map((task) => task.id);
    const auditLogs =
      taskIds.length > 0
        ? await this.auditLogRepository.findByEntityIds('task', taskIds)
        : [];

    const tasksByProjectId = groupTasksByProjectId(tasks);
    const statusChangesByTaskId = buildStatusChangeMap(auditLogs);

    const result: Record<number, ProjectRiskOutputDto> = {};
    for (const project of projects) {
      result[project.id] = await buildProjectRiskOutput(
        tasksByProjectId.get(project.id) ?? [],
        statusChangesByTaskId,
        this.riskService,
      );
    }

    return result;
  }

  @Post('risk/retrain')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Переобучение ML-модели (заглушка)' })
  @ApiResponse({ status: 200, description: 'Статус переобучения' })
  retrain() {
    return { message: 'Retraining not implemented yet' };
  }
}

function buildStatusChangeMap(auditLogs: AuditLog[]): Map<number, number> {
  const counts = new Map<number, number>();

  for (const log of auditLogs) {
    if (log.entityId === null || log.action !== AuditAction.STATUS_CHANGE) {
      continue;
    }

    counts.set(log.entityId, (counts.get(log.entityId) ?? 0) + 1);
  }

  return counts;
}

function buildAssigneeLoadMap(tasks: Task[]): Map<number, number> {
  const activeCountsByAssignee = new Map<number, number>();

  for (const task of tasks) {
    if (
      task.status === TaskStatus.DONE ||
      task.status === TaskStatus.CANCELLED
    ) {
      continue;
    }

    for (const uid of task.assigneeIds) {
      activeCountsByAssignee.set(uid, (activeCountsByAssignee.get(uid) ?? 0) + 1);
    }
  }

  const result = new Map<number, number>();
  for (const task of tasks) {
    if (task.assigneeIds.length === 0) {
      result.set(task.id, 0);
      continue;
    }

    const maxLoad = Math.max(
      ...task.assigneeIds.map((uid) => activeCountsByAssignee.get(uid) ?? 0),
    );
    result.set(task.id, Math.max(0, maxLoad - 1));
  }

  return result;
}

function groupTasksByProjectId(tasks: Task[]): Map<number, Task[]> {
  const grouped = new Map<number, Task[]>();

  for (const task of tasks) {
    const projectTasks = grouped.get(task.projectId) ?? [];
    projectTasks.push(task);
    grouped.set(task.projectId, projectTasks);
  }

  return grouped;
}

async function buildProjectRiskOutput(
  tasks: Task[],
  statusChangesByTaskId: Map<number, number>,
  riskService: IRiskAssessmentService,
): Promise<ProjectRiskOutputDto> {
  const activeTasks = tasks.filter(
    (task) =>
      task.status !== TaskStatus.DONE && task.status !== TaskStatus.CANCELLED,
  );

  if (activeTasks.length === 0) {
    return {
      riskScore: 0,
      riskLevel: 'low',
      tasksAtRisk: [],
      summary: 'В проекте нет активных задач. Риски отсутствуют.',
    };
  }

  const assigneeLoadByTaskId = buildAssigneeLoadMap(tasks);
  const tasksAtRisk: ProjectRiskOutputDto['tasksAtRisk'] = [];
  let totalDelay = 0;

  for (const task of activeTasks) {
    const taskRisk = await riskService.assessTask(
      buildTaskRiskInput(
        task,
        statusChangesByTaskId.get(task.id) ?? 0,
        assigneeLoadByTaskId.get(task.id) ?? 0,
      ),
    );

    totalDelay += taskRisk.delayProbability;
    if (taskRisk.delayProbability > 0.3) {
      tasksAtRisk.push({
        taskId: task.id,
        taskName: task.name,
        delayProbability: taskRisk.delayProbability,
      });
    }
  }

  tasksAtRisk.sort((left, right) => right.delayProbability - left.delayProbability);

  const averageDelay = totalDelay / activeTasks.length;
  const riskScore = Math.round(averageDelay * 100);
  const riskLevel =
    averageDelay > 0.6 ? 'high' : averageDelay > 0.3 ? 'medium' : 'low';
  const highRiskCount = tasksAtRisk.filter(
    (task) => task.delayProbability > 0.6,
  ).length;

  return {
    riskScore,
    riskLevel,
    tasksAtRisk,
    summary: buildProjectRiskSummary(
      riskLevel,
      riskScore,
      activeTasks.length,
      tasksAtRisk.length,
      highRiskCount,
    ),
  };
}

function buildProjectRiskSummary(
  riskLevel: 'low' | 'medium' | 'high',
  riskScore: number,
  totalActive: number,
  atRiskCount: number,
  highRiskCount: number,
): string {
  if (riskLevel === 'low') {
    return `Проект в зелёной зоне (${riskScore}/100). Из ${totalActive} активных задач нет задач с высоким риском.`;
  }
  if (riskLevel === 'medium') {
    return `Проект имеет средний уровень риска (${riskScore}/100). ${atRiskCount} из ${totalActive} активных задач требуют внимания.`;
  }

  return `Проект имеет высокий риск срыва сроков (${riskScore}/100): ${highRiskCount} задач с вероятностью задержки > 60%.`;
}
