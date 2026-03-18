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
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';

@ApiTags('Teams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ СЃРїРёСЃРѕРє РєРѕРјР°РЅРґ' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'РЎРїРёСЃРѕРє РєРѕРјР°РЅРґ' })
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
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ РєРѕРјР°РЅРґСѓ РїРѕ ID' })
  @ApiResponse({ status: 200, description: 'РљРѕРјР°РЅРґР° РЅР°Р№РґРµРЅР°' })
  @ApiResponse({ status: 404, description: 'РљРѕРјР°РЅРґР° РЅРµ РЅР°Р№РґРµРЅР°' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'РЎРѕР·РґР°С‚СЊ РєРѕРјР°РЅРґСѓ (Р°РІС‚РѕСЂ СЃС‚Р°РЅРѕРІРёС‚СЃСЏ owner)' })
  @ApiResponse({ status: 201, description: 'РљРѕРјР°РЅРґР° СЃРѕР·РґР°РЅР°' })
  create(@Body() dto: CreateTeamDto, @CurrentUser('id') userId: number) {
    return this.teamsService.create(dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'РћР±РЅРѕРІРёС‚СЊ РєРѕРјР°РЅРґСѓ (С‚РѕР»СЊРєРѕ owner)' })
  @ApiResponse({ status: 200, description: 'РљРѕРјР°РЅРґР° РѕР±РЅРѕРІР»РµРЅР°' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РљРѕРјР°РЅРґР° РЅРµ РЅР°Р№РґРµРЅР°' })
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
  @ApiOperation({ summary: 'РЈРґР°Р»РёС‚СЊ РєРѕРјР°РЅРґСѓ (С‚РѕР»СЊРєРѕ owner)' })
  @ApiResponse({ status: 204, description: 'РљРѕРјР°РЅРґР° СѓРґР°Р»РµРЅР°' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РљРѕРјР°РЅРґР° РЅРµ РЅР°Р№РґРµРЅР°' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.remove(id, userId, userRole);
  }
}
