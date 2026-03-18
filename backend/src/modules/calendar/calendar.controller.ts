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
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { parseOptionalInt } from '@/common/helpers/query.helper';

@ApiTags('Calendar Events')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calendar-events')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  @ApiOperation({ summary: 'Получить события календаря' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({
    name: 'from',
    required: false,
    description: 'Начало диапазона (ISO 8601)',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    description: 'Конец диапазона (ISO 8601)',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список событий' })
  findAll(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
    @Query('search') search?: string,
    @Query('projectId') projectId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const parsedProjectId = parseOptionalInt(projectId);

    return this.calendarService.findAll(
      {
        search,
        sort,
        page: parseOptionalInt(page),
        limit: parseOptionalInt(limit),
      },
      userId,
      userRole,
      {
        projectId: parsedProjectId,
        from,
        to,
      },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить событие по ID' })
  @ApiResponse({ status: 200, description: 'Событие найдено' })
  @ApiResponse({ status: 404, description: 'Событие не найдено' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.calendarService.findById(id, userId, userRole);
  }

  @Post()
  @ApiOperation({ summary: 'Создать событие в календаре' })
  @ApiResponse({ status: 201, description: 'Событие создано' })
  @ApiResponse({ status: 400, description: 'Ошибка валидации' })
  create(
    @Body() dto: CreateCalendarEventDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.calendarService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить событие' })
  @ApiResponse({ status: 200, description: 'Событие обновлено' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Событие не найдено' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCalendarEventDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.calendarService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить событие' })
  @ApiResponse({ status: 204, description: 'Событие удалено' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.calendarService.remove(id, userId, userRole);
  }
}
