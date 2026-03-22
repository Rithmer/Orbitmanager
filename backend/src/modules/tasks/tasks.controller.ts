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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';
import { parseOptionalInt } from '@/common/helpers/query.helper';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список задач' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'difficulty', required: false, type: Number })
  @ApiQuery({ name: 'assigneeId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список задач' })
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @Query('status') status?: string,
    @Query('difficulty') difficulty?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const parsedProjectId = parseOptionalInt(projectId);
    const parsedDifficulty = parseOptionalInt(difficulty);
    const parsedAssigneeId = parseOptionalInt(assigneeId);

    return this.tasksService.findAll(
      {
        search,
        sort,
        page: parseOptionalInt(page),
        limit: parseOptionalInt(limit),
        filters: {
          ...(parsedProjectId !== undefined ? { projectId: parsedProjectId } : {}),
          ...(status ? { status } : {}),
          ...(parsedDifficulty !== undefined ? { difficulty: parsedDifficulty } : {}),
          ...(parsedAssigneeId !== undefined ? { assigneeId: parsedAssigneeId } : {}),
        },
      },
      userId,
      userRole,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить задачу по ID' })
  @ApiResponse({ status: 200, description: 'Задача найдена' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.findById(id, userId, userRole);
  }

  @Post()
  @ApiOperation({ summary: 'Создать задачу (БП1: owner / team_lead)' })
  @ApiResponse({ status: 201, description: 'Задача создана' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Проект не найден' })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить задачу / изменить статус (БП2)' })
  @ApiResponse({ status: 200, description: 'Задача обновлена' })
  @ApiResponse({ status: 422, description: 'Недопустимый переход статуса' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить задачу (owner / team_lead)' })
  @ApiResponse({ status: 204, description: 'Задача удалена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Задача не найдена' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.remove(id, userId, userRole);
  }
}
