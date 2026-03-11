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
import { TeamsService } from './teams.service';
import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums/account-role.enum';

@ApiTags('Team Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TeamMembersController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('teams/:teamId/members')
  @ApiOperation({ summary: 'Получить участников команды' })
  @ApiResponse({ status: 200, description: 'Список участников' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  findMembers(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.findMembers(teamId);
  }

  @Post('teams/:teamId/members')
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

  @Patch('team-members/:id')
  @ApiOperation({ summary: 'Изменить роль участника (только owner)' })
  @ApiResponse({ status: 200, description: 'Роль обновлена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.updateMember(id, dto, userId, userRole);
  }

  @Delete('team-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить участника из команды (только owner)' })
  @ApiResponse({ status: 204, description: 'Участник удалён' })
  @ApiResponse({ status: 403, description: 'Нет прав / единственный owner' })
  @ApiResponse({ status: 404, description: 'Участник не найден' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.removeMember(id, userId, userRole);
  }
}
