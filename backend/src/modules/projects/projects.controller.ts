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
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ProjectRolesGuard } from '@/common/guards/project-roles.guard';
import { ProjectRoles } from '@/common/decorators/project-roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectRole } from '@/common/enums/project-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список проектов' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список проектов' })
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('search') search?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.projectsService.findAll(
      {
        search,
        sort,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        filters: {
          ...(teamId ? { teamId: parseInt(teamId, 10) } : {}),
          ...(status ? { status } : {}),
        },
      },
      userId,
      userRole,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить проект по ID' })
  @ApiResponse({ status: 200, description: 'Проект найден' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.findById(id, userId, userRole);
  }

  @Post()
  @ApiOperation({ summary: 'Создать проект (только owner команды)' })
  @ApiResponse({ status: 201, description: 'Проект создан' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @UseGuards(ProjectRolesGuard)
  @ProjectRoles(ProjectRole.TEAM_LEAD)
  @ApiOperation({ summary: 'Обновить проект (owner / team_lead)' })
  @ApiResponse({ status: 200, description: 'Проект обновлён' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProjectDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить проект (только owner команды)' })
  @ApiResponse({ status: 204, description: 'Проект удалён' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.remove(id, userId, userRole);
  }
}
