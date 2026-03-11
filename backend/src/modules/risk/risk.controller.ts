import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  Inject,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountRolesGuard } from '../../common/guards/account-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums/account-role.enum';
import { TeamRole } from '../../common/enums/team-role.enum';
import { AuditAction } from '../../common/enums/audit-action.enum';
import type { IRiskAssessmentService } from '../../domain/services/risk-assessment.interface';
import { RISK_ASSESSMENT_SERVICE } from '../../domain/services/risk-assessment.interface';
import type { ITaskRepository } from '../../domain/repositories/task.repository';
import { TASK_REPOSITORY } from '../../domain/repositories/task.repository';
import type { IProjectRepository } from '../../domain/repositories/project.repository';
import { PROJECT_REPOSITORY } from '../../domain/repositories/project.repository';
import type { IProjectMemberRepository } from '../../domain/repositories/project-member.repository';
import { PROJECT_MEMBER_REPOSITORY } from '../../domain/repositories/project-member.repository';
import type { ITeamMemberRepository } from '../../domain/repositories/team-member.repository';
import { TEAM_MEMBER_REPOSITORY } from '../../domain/repositories/team-member.repository';
import type { IAuditLogRepository } from '../../domain/repositories/audit-log.repository';
import { AUDIT_LOG_REPOSITORY } from '../../domain/repositories/audit-log.repository';
import { TaskRiskOutputDto, ProjectRiskOutputDto } from './dto';
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
    @Inject(PROJECT_MEMBER_REPOSITORY)
    private readonly projectMemberRepository: IProjectMemberRepository,
    @Inject(TEAM_MEMBER_REPOSITORY)
    private readonly teamMemberRepository: ITeamMemberRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {}

  @Get('tasks/:id/risk')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Оценка рисков задачи' })
  @ApiResponse({ status: 200, description: 'Оценка рисков задачи', type: TaskRiskOutputDto })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  @ApiResponse({ status: 403, description: 'Нет доступа к задаче' })
  async getTaskRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<TaskRiskOutputDto> {
    const task = await this.taskRepository.findById(id);
    if (!task) throw new NotFoundException(`Задача #${id} не найдена`);

    const project = await this.projectRepository.findById(task.projectId);
    if (!project) throw new NotFoundException(`Проект #${task.projectId} не найден`);

    // Check access
    if (userRole !== AccountRole.ADMIN) {
      await this.assertProjectAccess(userId, project.teamId, task.projectId);
    }

    // Gather input data
    const auditLogs = await this.auditLogRepository.findByEntity('task', task.id);
    const allTasks = await this.taskRepository.findByProject(task.projectId);

    const statusChangesCount = auditLogs.filter(
      (l) => l.action === AuditAction.STATUS_CHANGE,
    ).length;

    const assigneeLoad = task.assigneeId
      ? allTasks.filter(
          (t) =>
            t.assigneeId === task.assigneeId &&
            t.status !== 'done' &&
            t.status !== 'cancelled' &&
            t.id !== task.id,
        ).length
      : 0;

    const input = buildTaskRiskInput(task, statusChangesCount, assigneeLoad);

    return this.riskService.assessTask(input);
  }

  @Get('projects/:id/risk')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Оценка рисков проекта (БП3: Мониторинг)' })
  @ApiResponse({ status: 200, description: 'Оценка рисков проекта', type: ProjectRiskOutputDto })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @ApiResponse({ status: 403, description: 'Нет доступа к проекту' })
  async getProjectRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<ProjectRiskOutputDto> {
    const project = await this.projectRepository.findById(id);
    if (!project) throw new NotFoundException(`Проект #${id} не найден`);

    // Check access
    if (userRole !== AccountRole.ADMIN) {
      await this.assertProjectAccess(userId, project.teamId, project.id);
    }

    return this.riskService.assessProject(id);
  }

  @Post('risk/retrain')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Переобучение ML-модели (заглушка)' })
  @ApiResponse({ status: 200, description: 'Статус переобучения' })
  retrain() {
    return { message: 'Retraining not implemented yet' };
  }

  // ────────────── Helpers ──────────────

  private async assertProjectAccess(
    userId: number,
    teamId: number,
    projectId: number,
  ): Promise<void> {
    const teamMembership = await this.teamMemberRepository.findByUserAndTeam(userId, teamId);
    if (!teamMembership) {
      throw new ForbiddenException('Вы не являетесь участником команды');
    }

    // Owner and member see all projects
    if (teamMembership.teamRole === TeamRole.OWNER || teamMembership.teamRole === TeamRole.MEMBER) {
      return;
    }

    // Observer — only assigned projects
    const projectMembership = await this.projectMemberRepository.findByUserAndProject(userId, projectId);
    if (!projectMembership) {
      throw new ForbiddenException('У вас нет доступа к этому проекту');
    }
  }
}
