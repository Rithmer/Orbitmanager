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
import { ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import type { AuditLog } from '@/domain/models/audit-log.model';
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
import type { RiskPageProjectDto, RiskPageTaskDto } from './dto';
import { MlClientService } from './ml-client.service';
import { ConfigService } from '@nestjs/config';
import { buildTaskRiskInput } from './helpers/build-task-risk-input';
import { RiskPageReadModelService } from './risk-page-read-model.service';
import { RiskPageProjectionService } from './risk-page-projection.service';

@ApiTags('Risk Assessment')
@ApiAuth()
@UseGuards(AccountRolesGuard)
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
    private readonly mlClient: MlClientService,
    private readonly configService: ConfigService,
    private readonly riskPageReadModel: RiskPageReadModelService,
    private readonly riskPageProjection: RiskPageProjectionService,
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
      (log: AuditLog) => log.action === AuditAction.STATUS_CHANGE,
    ).length;

    const assigneeLoad =
      task.assigneeIds.length > 0
        ? Math.max(
            ...task.assigneeIds.map(
              (uid: number) =>
                allTasks.filter(
                  (candidate: Task) =>
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
  @ApiOperation({ summary: 'Оценка рисков всех задач проекта (расширенный)' })
  @ApiResponse({ status: 200, description: 'Риски всех задач проекта' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @ApiResponse({
    status: 503,
    description: 'ML-сервис недоступен (strict mode)',
  })
  async getProjectTasksRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<Record<number, RiskPageTaskDto>> {
    const context = await this.riskPageReadModel.loadContext(userId, userRole, [
      id,
    ]);

    if (!context.projectIds.includes(id)) {
      throw new NotFoundException(`Проект #${id} не найден`);
    }

    return this.riskPageProjection.buildTasksPage(context, id);
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
    summary: 'Оценка рисков всех видимых проектов (расширенный, page-ready)',
  })
  @ApiResponse({ status: 200, description: 'Риски проектов' })
  @ApiResponse({
    status: 503,
    description: 'ML-сервис недоступен (strict mode)',
  })
  async getAllProjectsRisk(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('projectIds') projectIdsParam?: string | string[],
    @Query('ids') legacyIds?: string | string[],
  ): Promise<Record<number, RiskPageProjectDto>> {
    const requestedProjectIds = this.readModelResponseFactory.normalizeIds(
      projectIdsParam ?? legacyIds,
    );

    const context = await this.riskPageReadModel.loadContext(
      userId,
      userRole,
      requestedProjectIds.length > 0 ? requestedProjectIds : undefined,
    );

    return this.riskPageProjection.buildProjectsPage(context);
  }

  @Post('risk/retrain')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Переобучение ML-модели рисков' })
  @ApiResponse({ status: 200, description: 'Статус переобучения' })
  @ApiResponse({ status: 502, description: 'ML-сервис недоступен' })
  async retrain(): Promise<{
    status: string;
    message: string;
    metrics?: Record<string, unknown> | null;
  }> {
    const result = await this.mlClient.retrain();
    if (!result) {
      return { status: 'error', message: 'ML service is unavailable' };
    }
    return result;
  }

  @Get('risk/ml-status')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Статус ML-сервиса и информация о модели' })
  @ApiResponse({ status: 200, description: 'Статус ML-сервиса' })
  async getMlStatus(): Promise<{
    provider: string;
    health: { status: string; model_loaded: boolean; version: string } | null;
    modelInfo: {
      model_type: string;
      version: string;
      trained_at: string | null;
      sample_size: number | null;
      features: string[];
      metrics: Record<string, unknown> | null;
    } | null;
  }> {
    const provider = this.configService.get<string>('RISK_PROVIDER') ?? 'stub';
    const [health, modelInfo] = await Promise.all([
      this.mlClient.health(),
      this.mlClient.modelInfo(),
    ]);
    return { provider, health, modelInfo };
  }
}
