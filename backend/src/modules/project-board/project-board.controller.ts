import { Controller, Get, Param, ParseIntPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ProjectBoardService } from './project-board.service';
import type { ProjectBoardViewResponseDto } from './project-board.types';

@ApiTags('Project Board View')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccountRolesGuard)
@Controller('projects')
export class ProjectBoardController {
  constructor(private readonly projectBoardService: ProjectBoardService) {}

  @Get(':id/board-view')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Получить board view проекта' })
  @ApiResponse({ status: 200, description: 'Board view проекта' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  @ApiResponse({ status: 403, description: 'Нет доступа к проекту' })
  getBoardView(
    @Param('id', ParseIntPipe) projectId: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') accountRole: AccountRole,
  ): Promise<ProjectBoardViewResponseDto> {
    return this.projectBoardService.getBoardView(projectId, userId, accountRole);
  }
}
