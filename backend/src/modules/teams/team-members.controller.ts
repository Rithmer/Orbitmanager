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
import { ApiTags, ApiQuery, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { TeamsService } from './teams.service';
import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { TeamRolesGuard } from '@/common/guards/team-roles.guard';
import { TeamRoles } from '@/common/decorators/team-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { TeamRole } from '@/common/enums/team-role.enum';
import {
  normalizeIds,
  pickGroupedByIds,
} from '@/common/read-models/read-model-response.factory';

@ApiTags('Team Members')
@ApiAuth()
@Controller()
export class TeamMembersController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('teams/members/batch')
  @ApiQuery({
    name: 'teamIds',
    required: false,
    type: String,
    description: 'Comma-separated list of team ids',
  })
  @ApiOperation({ summary: 'Получить участников всех команд' })
  @ApiResponse({
    status: 200,
    description: 'Участники сгруппированные по teamId',
  })
  async findAllMembersBatch(
    @Query('teamIds') teamIds?: string | string[],
    @Query('ids') legacyIds?: string | string[],
  ) {
    const allMembersByTeamId = await this.teamsService.findAllMembersBatch();
    const requestedTeamIds = normalizeIds(teamIds ?? legacyIds);

    if (teamIds === undefined && legacyIds === undefined) {
      return allMembersByTeamId;
    }

    if (requestedTeamIds.length === 0) {
      return {};
    }

    return pickGroupedByIds(allMembersByTeamId, requestedTeamIds);
  }

  @Get('teams/:teamId/members')
  @ApiOperation({ summary: 'Получить участников команды' })
  @ApiResponse({ status: 200, description: 'Список участников' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  findMembers(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.findMembers(teamId);
  }

  @Post('teams/:teamId/members')
  @UseGuards(TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER)
  @ApiOperation({ summary: 'Добавить участника в команду (только owner)' })
  @ApiResponse({ status: 201, description: 'Участник добавлен' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 409, description: 'Участник уже в команде' })
  addMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.addMember(teamId, dto, userId, userRole);
  }

  @Patch('teams/:teamId/members/:id')
  @UseGuards(TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER)
  @ApiOperation({ summary: 'Изменить роль участника (только owner)' })
  @ApiResponse({ status: 200, description: 'Роль обновлена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  updateMember(
    @Param('teamId', ParseIntPipe) _teamId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.updateMember(id, dto, userId, userRole);
  }

  @Patch('team-members/:id')
  @UseGuards(AccountRolesGuard)
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  legacyUpdateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.updateMember(id, dto, userId, userRole);
  }

  @Delete('teams/:teamId/members/:id')
  @UseGuards(TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить участника из команды (только owner)' })
  @ApiResponse({ status: 204, description: 'Участник удалён' })
  @ApiResponse({ status: 403, description: 'Нет прав / единственный owner' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  removeMember(
    @Param('teamId', ParseIntPipe) _teamId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.removeMember(id, userId, userRole);
  }

  @Delete('team-members/:id')
  @UseGuards(AccountRolesGuard)
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @HttpCode(HttpStatus.NO_CONTENT)
  legacyRemoveMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.removeMember(id, userId, userRole);
  }
}
