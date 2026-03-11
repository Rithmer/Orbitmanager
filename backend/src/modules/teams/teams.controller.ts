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
import { TeamsService } from './teams.service';
import { CreateTeamDto, UpdateTeamDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TeamRolesGuard } from '../../common/guards/team-roles.guard';
import { TeamRoles } from '../../common/decorators/team-roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AccountRole } from '../../common/enums/account-role.enum';
import { TeamRole } from '../../common/enums/team-role.enum';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список команд' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список команд' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.teamsService.findAll({
      search,
      sort,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить команду по ID' })
  @ApiResponse({ status: 200, description: 'Команда найдена' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Создать команду (автор становится owner)' })
  @ApiResponse({ status: 201, description: 'Команда создана' })
  create(
    @Body() dto: CreateTeamDto,
    @CurrentUser('id') userId: number,
  ) {
    return this.teamsService.create(dto, userId);
  }

  @Patch(':id')
  @UseGuards(TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER)
  @ApiOperation({ summary: 'Обновить команду (только owner)' })
  @ApiResponse({ status: 200, description: 'Команда обновлена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TeamRolesGuard)
  @TeamRoles(TeamRole.OWNER)
  @ApiOperation({ summary: 'Удалить команду (только owner)' })
  @ApiResponse({ status: 204, description: 'Команда удалена' })
  @ApiResponse({ status: 403, description: 'Нет прав' })
  @ApiResponse({ status: 404, description: 'Команда не найдена' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.remove(id, userId, userRole);
  }
}
