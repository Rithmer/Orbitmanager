import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { ProjectRiskOutputDto, TaskRiskOutputDto } from './dto';
import { RiskStubService } from './risk-stub.service';
import { buildTaskRiskInput } from './helpers/build-task-risk-input';

@ApiTags('Risk Assessment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccountRolesGuard)
@Controller()
export class RiskController {
  constructor(
    private readonly riskService: RiskStubService,
    private readonly prisma: PrismaService,
    private readonly projectAccessService: ProjectAccessService,
  ) {}

  @Get('tasks/:id/risk')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'РћС†РµРЅРєР° СЂРёСЃРєРѕРІ Р·Р°РґР°С‡Рё' })
  @ApiResponse({
    status: 200,
    description: 'РћС†РµРЅРєР° СЂРёСЃРєРѕРІ Р·Р°РґР°С‡Рё',
    type: TaskRiskOutputDto,
  })
  @ApiResponse({ status: 404, description: 'Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РґРѕСЃС‚СѓРїР° Рє Р·Р°РґР°С‡Рµ' })
  async getTaskRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<TaskRiskOutputDto> {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) {
      throw new NotFoundException(`Р—Р°РґР°С‡Р° #${id} РЅРµ РЅР°Р№РґРµРЅР°`);
    }

    const project = await this.prisma.project.findUnique({
      where: { id: task.projectId },
    });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${task.projectId} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    const [auditLogs, allTasks] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          entityType: 'task',
          entityId: task.id,
        },
      }),
      this.prisma.task.findMany({
        where: { projectId: task.projectId },
      }),
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
  @ApiOperation({ summary: 'РћС†РµРЅРєР° СЂРёСЃРєРѕРІ РїСЂРѕРµРєС‚Р° (Р‘Рџ3: РњРѕРЅРёС‚РѕСЂРёРЅРі)' })
  @ApiResponse({
    status: 200,
    description: 'РћС†РµРЅРєР° СЂРёСЃРєРѕРІ РїСЂРѕРµРєС‚Р°',
    type: ProjectRiskOutputDto,
  })
  @ApiResponse({ status: 404, description: 'РџСЂРѕРµРєС‚ РЅРµ РЅР°Р№РґРµРЅ' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РґРѕСЃС‚СѓРїР° Рє РїСЂРѕРµРєС‚Сѓ' })
  async getProjectRisk(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ): Promise<ProjectRiskOutputDto> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) {
      throw new NotFoundException(`РџСЂРѕРµРєС‚ #${id} РЅРµ РЅР°Р№РґРµРЅ`);
    }

    if (userRole !== AccountRole.ADMIN) {
      await this.projectAccessService.assertProjectVisibility(project, userId);
    }

    return this.riskService.assessProject(id);
  }

  @Post('risk/retrain')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'РџРµСЂРµРѕР±СѓС‡РµРЅРёРµ ML-РјРѕРґРµР»Рё (Р·Р°РіР»СѓС€РєР°)' })
  @ApiResponse({ status: 200, description: 'РЎС‚Р°С‚СѓСЃ РїРµСЂРµРѕР±СѓС‡РµРЅРёСЏ' })
  retrain() {
    return { message: 'Retraining not implemented yet' };
  }
}
