import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { parseOptionalInt } from '@/common/helpers/query.helper';
import { TeamsListViewService } from './teams-list-view.service';
import type { TeamsListViewResponseDto } from './teams-list-view.types';

@ApiTags('Teams List View')
@ApiBearerAuth()
@Controller('teams/list-view')
export class TeamsListViewController {
  constructor(private readonly teamsListViewService: TeamsListViewService) {}

  @Get()
  @ApiOperation({
    summary: 'Получить пагинированный список команд для карточек',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список команд' })
  getListView(
    @CurrentUser('id') userId: number,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ): Promise<TeamsListViewResponseDto> {
    return this.teamsListViewService.getListView(
      {
        search,
        page: parseOptionalInt(page),
        limit: parseOptionalInt(limit),
        sort,
      },
      userId,
    );
  }
}
