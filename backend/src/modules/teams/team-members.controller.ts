import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
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
} from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { AddTeamMemberDto, UpdateTeamMemberDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';

@ApiTags('Team Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TeamMembersController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('teams/:teamId/members')
  @ApiOperation({ summary: 'РџРѕР»СѓС‡РёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєРѕРІ РєРѕРјР°РЅРґС‹' })
  @ApiResponse({ status: 200, description: 'РЎРїРёСЃРѕРє СѓС‡Р°СЃС‚РЅРёРєРѕРІ' })
  @ApiResponse({ status: 404, description: 'РљРѕРјР°РЅРґР° РЅРµ РЅР°Р№РґРµРЅР°' })
  findMembers(@Param('teamId', ParseIntPipe) teamId: number) {
    return this.teamsService.findMembers(teamId);
  }

  @Post('teams/:teamId/members')
  @ApiOperation({ summary: 'Р”РѕР±Р°РІРёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєР° РІ РєРѕРјР°РЅРґСѓ (С‚РѕР»СЊРєРѕ owner)' })
  @ApiResponse({ status: 201, description: 'РЈС‡Р°СЃС‚РЅРёРє РґРѕР±Р°РІР»РµРЅ' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 409, description: 'РЈС‡Р°СЃС‚РЅРёРє СѓР¶Рµ РІ РєРѕРјР°РЅРґРµ' })
  addMember(
    @Param('teamId', ParseIntPipe) teamId: number,
    @Body() dto: AddTeamMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.addMember(teamId, dto, userId, userRole);
  }

  @Patch('team-members/:id')
  @ApiOperation({ summary: 'РР·РјРµРЅРёС‚СЊ СЂРѕР»СЊ СѓС‡Р°СЃС‚РЅРёРєР° (С‚РѕР»СЊРєРѕ owner)' })
  @ApiResponse({ status: 200, description: 'Р РѕР»СЊ РѕР±РЅРѕРІР»РµРЅР°' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ' })
  @ApiResponse({ status: 404, description: 'РЈС‡Р°СЃС‚РЅРёРє РЅРµ РЅР°Р№РґРµРЅ' })
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTeamMemberDto,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.updateMember(id, dto, userId, userRole);
  }

  @Delete('team-members/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'РЈРґР°Р»РёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєР° РёР· РєРѕРјР°РЅРґС‹ (С‚РѕР»СЊРєРѕ owner)' })
  @ApiResponse({ status: 204, description: 'РЈС‡Р°СЃС‚РЅРёРє СѓРґР°Р»С‘РЅ' })
  @ApiResponse({ status: 403, description: 'РќРµС‚ РїСЂР°РІ / РµРґРёРЅСЃС‚РІРµРЅРЅС‹Р№ owner' })
  @ApiResponse({ status: 404, description: 'РЈС‡Р°СЃС‚РЅРёРє РЅРµ РЅР°Р№РґРµРЅ' })
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') userRole: AccountRole,
  ) {
    return this.teamsService.removeMember(id, userId, userRole);
  }
}
