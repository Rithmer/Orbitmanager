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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectStatus } from '@/common/enums/project-status.enum';

@ApiTags('Projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ СЃРїРёСЃРѕРє РїСЂРѕРµРєС‚РѕРІ' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'teamId', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: ProjectStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'РЎРїРёСЃРѕРє РїСЂРѕРµРєС‚РѕРІ' })
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
        teamId: teamId ? parseInt(teamId, 10) : undefined,
        status,
      },
      userId,
      userRole,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ РїСЂРѕРµРєС‚ РїРѕ ID' })
  @ApiResponse({ status: 200, description: 'РџСЂРѕРµРєС‚ РЅР°Р№РґРµРЅ' })
  @ApiResponse({ status: 404, description: 'РџСЂРѕРµРєС‚ РЅРµ РЅР°Р№РґРµРЅ' })
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.findById(id, userId, userRole);
  }

  @Post()
  @ApiOperation({ summary: 'РЎРѕР·РґР°С‚СЊ РїСЂРѕРµРєС‚ (С‚РѕР»СЊРєРѕ owner РєРѕРјР°РЅРґС‹)' })
  @ApiResponse({ status: 201, description: 'РџСЂРѕРµРєС‚ СЃРѕР·РґР°РЅ' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РљРѕРјР°РЅРґР° РЅРµ РЅР°Р№РґРµРЅР°' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.create(dto, userId, userRole);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'РћР±РЅРѕРІРёС‚СЊ РїСЂРѕРµРєС‚ (owner / team_lead)' })
  @ApiResponse({ status: 200, description: 'РџСЂРѕРµРєС‚ РѕР±РЅРѕРІР»С‘РЅ' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РџСЂРѕРµРєС‚ РЅРµ РЅР°Р№РґРµРЅ' })
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
  @ApiOperation({ summary: 'РЈРґР°Р»РёС‚СЊ РїСЂРѕРµРєС‚ (С‚РѕР»СЊРєРѕ owner РєРѕРјР°РЅРґС‹)' })
  @ApiResponse({ status: 204, description: 'РџСЂРѕРµРєС‚ СѓРґР°Р»С‘РЅ' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РџСЂРѕРµРєС‚ РЅРµ РЅР°Р№РґРµРЅ' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.projectsService.remove(id, userId, userRole);
  }
}
