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
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { TaskStatus } from '@/common/enums/task-status.enum';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ СЃРїРёСЃРѕРє Р·Р°РґР°С‡' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'difficulty', required: false, type: Number })
  @ApiQuery({ name: 'assigneeId', required: false, type: Number })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'РЎРїРёСЃРѕРє Р·Р°РґР°С‡' })
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
    return this.tasksService.findAll(
      {
        search,
        sort,
        page: page ? parseInt(page, 10) : undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        projectId: projectId ? parseInt(projectId, 10) : undefined,
        status,
        difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
        assigneeId: assigneeId ? parseInt(assigneeId, 10) : undefined,
      },
      userId,
      userRole,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ Р·Р°РґР°С‡Сѓ РїРѕ ID' })
  @ApiResponse({ status: 200, description: 'Р—Р°РґР°С‡Р° РЅР°Р№РґРµРЅР°' })
  @ApiResponse({ status: 404, description: 'Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.findById(id, userId, userRole);
  }

  @Post()
  @ApiOperation({ summary: 'РЎРѕР·РґР°С‚СЊ Р·Р°РґР°С‡Сѓ (Р‘Рџ1: owner / team_lead)' })
  @ApiResponse({ status: 201, description: 'Р—Р°РґР°С‡Р° СЃРѕР·РґР°РЅР°' })
  @ApiResponse({ status: 400, description: 'РћС€РёР±РєР° РІР°Р»РёРґР°С†РёРё' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РџСЂРѕРµРєС‚ РЅРµ РЅР°Р№РґРµРЅ' })
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'РћР±РЅРѕРІРёС‚СЊ Р·Р°РґР°С‡Сѓ / РёР·РјРµРЅРёС‚СЊ СЃС‚Р°С‚СѓСЃ (Р‘Рџ2)' })
  @ApiResponse({ status: 200, description: 'Р—Р°РґР°С‡Р° РѕР±РЅРѕРІР»РµРЅР°' })
  @ApiResponse({ status: 422, description: 'РќРµРґРѕРїСѓСЃС‚РёРјС‹Р№ РїРµСЂРµС…РѕРґ СЃС‚Р°С‚СѓСЃР°' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°' })
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
  @ApiOperation({ summary: 'РЈРґР°Р»РёС‚СЊ Р·Р°РґР°С‡Сѓ (owner / team_lead)' })
  @ApiResponse({ status: 204, description: 'Р—Р°РґР°С‡Р° РѕСѓРґР°Р»РµРЅР°' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'Р—Р°РґР°С‡Р° РЅРµ РЅР°Р№РґРµРЅР°' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.tasksService.remove(id, userId, userRole);
  }
}
