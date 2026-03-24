import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { ProjectsService } from './projects.service';
import { AddProjectMemberDto, UpdateProjectMemberDto } from './dto';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ReadModelResponseFactory } from '@/common/read-models/read-model-response.factory';

@ApiTags('Project Members')
@ApiAuth()
@UseGuards(AccountRolesGuard)
@Controller()
export class ProjectMembersController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly readModelResponseFactory: ReadModelResponseFactory,
  ) {}

  @Get('projects/members/batch')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiQuery({
    name: 'projectIds',
    required: false,
    type: String,
    description: 'Comma-separated list of project ids',
  })
  @ApiOperation({ summary: 'Получить участников всех видимых проектов' })
  @ApiResponse({
    status: 200,
    description: 'Участники сгруппированные по projectId',
  })
  async findAllMembersBatch(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('projectIds') projectIds?: string | string[],
    @Query('ids') legacyIds?: string | string[],
  ) {
    const allMembersByProjectId = await this.projectsService.findAllMembersBatch(
      userId,
      userRole,
    );
    const requestedProjectIds = this.readModelResponseFactory.normalizeIds(
      projectIds ?? legacyIds,
    );

    if (projectIds === undefined && legacyIds === undefined) {
      return allMembersByProjectId;
    }

    if (requestedProjectIds.length === 0) {
      return {};
    }

    return this.readModelResponseFactory.pickGroupedByIds(
      allMembersByProjectId,
      requestedProjectIds,
    );
  }

  @Get('projects/:projectId/members')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Получить участников проекта' })
  @ApiResponse({ status: 200, description: 'Список участников' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  findMembers(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.findMembers(projectId, userId, userRole);
  }

  @Post('projects/:projectId/members')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({
    summary: 'Назначить участника в проект (только owner команды)',
  })
  @ApiResponse({ status: 201, description: 'Участник назначен' })
  @ApiResponse({
    status: 400,
    description: 'Пользователь не в команде / неверная роль',
  })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 409, description: 'Участник уже в проекте' })
  addMember(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: AddProjectMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.addMember(projectId, dto, userId, userRole);
  }

  @Patch('projects/:projectId/members/:id')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({
    summary: 'Изменить роль участника проекта (только owner команды)',
  })
  @ApiResponse({ status: 200, description: 'Роль обновлена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  updateMember(
    @Param('projectId', ParseIntPipe) _projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.updateMember(id, dto, userId, userRole);
  }

  @Delete('projects/:projectId/members/:id')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Убрать участника из проекта (только owner команды)',
  })
  @ApiResponse({ status: 204, description: 'Участник удалён из проекта' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  removeMember(
    @Param('projectId', ParseIntPipe) _projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.removeMember(id, userId, userRole);
  }
}
