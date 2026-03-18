import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
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
import type { IAuditLogRepository } from '@/domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import type { IProjectRepository } from '@/domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '@/domain/repositories/project.repository';
import type { ITaskRepository } from '@/domain/repositories/task.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import type { IRiskAssessmentService } from '@/domain/services/risk-assessment.interface';
import { RISK_ASSESSMENT_SERVICE } from '@/domain/services/risk-assessment.interface';
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

    const assigneeLoad = task.assigneeId
      ? allTasks.filter(
          (candidate) =>
            candidate.assigneeId === task.assigneeId &&
            candidate.status !== TaskStatus.DONE &&
            candidate.status !== TaskStatus.CANCELLED &&
            candidate.id !== task.id,
        ).length
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

    const result: Record<number, TaskRiskOutputDto> = {};
    for (const task of allTasks) {
      const statusChangesCount = auditLogs.filter(
        (log) =>
          log.entityId === task.id &&
          log.action === AuditAction.STATUS_CHANGE,
      ).length;

      const assigneeLoad = task.assigneeId
        ? allTasks.filter(
            (c) =>
              c.assigneeId === task.assigneeId &&
              c.status !== TaskStatus.DONE &&
              c.status !== TaskStatus.CANCELLED &&
              c.id !== task.id,
          ).length
        : 0;

      const input = buildTaskRiskInput(task, statusChangesCount, assigneeLoad);
      result[task.id] = await this.riskService.assessTask(input);
    }

    return result;
  }

  @Get('risks/projects')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({
    summary: 'Оценка рисков всех видимых проектов (пакетный)',
  })
  @ApiResponse({ status: 200, description: 'Риски проектов' })
  async getAllProjectsRisk(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<Record<number, ProjectRiskOutputDto>> {
    const projects =
      userRole === AccountRole.ADMIN
        ? await this.projectRepository.findAll()
        : await this.projectAccessService.getVisibleProjects(userId);

    const projectIds = projects.map((p) => p.id);
    return this.riskService.assessProjectsBatch(projectIds);
  }

  @Post('risk/retrain')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Переобучение ML-модели (заглушка)' })
  @ApiResponse({ status: 200, description: 'Статус переобучения' })
  retrain() {
    return { message: 'Retraining not implemented yet' };
  }
}
