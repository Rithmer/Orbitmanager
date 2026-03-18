import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { parseOptionalInt } from '@/common/helpers/query.helper';
import { ProjectsListViewService } from './projects-list-view.service';
import type { ProjectsListViewResponseDto } from './projects-list-view.types';

@ApiTags('Projects List View')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects/list-view')
export class ProjectsListViewController {
  constructor(private readonly projectsListViewService: ProjectsListViewService) {}

  @Get()
  @ApiOperation({ summary: 'Получить пагинированный список проектов для карточек' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список проектов' })
  getListView(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('search') search?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ): Promise<ProjectsListViewResponseDto> {
    return this.projectsListViewService.getListView(
      {
        search,
        teamId: parseOptionalInt(teamId),
        status,
        page: parseOptionalInt(page),
        limit: parseOptionalInt(limit),
        sort,
      },
      userId,
      userRole,
    );
  }
}
