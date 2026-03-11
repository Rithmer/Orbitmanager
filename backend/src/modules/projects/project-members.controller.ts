import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { AddProjectMemberDto, UpdateProjectMemberDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountRolesGuard } from '../../common/guards/account-roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums/account-role.enum';

@ApiTags('Project Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccountRolesGuard)
@Controller()
export class ProjectMembersController {
  constructor(private readonly projectsService: ProjectsService) {}

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
  @ApiOperation({ summary: 'Назначить участника в проект (только owner команды)' })
  @ApiResponse({ status: 201, description: 'Участник назначен' })
  @ApiResponse({ status: 400, description: 'Пользователь не в команде / неверная роль' })
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

  @Patch('project-members/:id')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Изменить роль участника проекта (только owner команды)' })
  @ApiResponse({ status: 200, description: 'Роль обновлена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.updateMember(id, dto, userId, userRole);
  }

  @Delete('project-members/:id')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Убрать участника из проекта (только owner команды)' })
  @ApiResponse({ status: 204, description: 'Участник удалён из проекта' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.removeMember(id, userId, userRole);
  }
}
