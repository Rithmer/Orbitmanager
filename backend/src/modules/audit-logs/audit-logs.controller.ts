import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { parseOptionalInt } from '@/common/helpers/query.helper';

@ApiTags('Audit Logs')
@ApiBearerAuth()
@UseGuards(AccountRolesGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Получить журнал аудита' })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  @ApiQuery({ name: 'entityType', required: false })
  @ApiQuery({ name: 'entityId', required: false, type: Number })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'from', required: false, description: 'ISO date from' })
  @ApiQuery({ name: 'to', required: false, description: 'ISO date to' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiResponse({ status: 200, description: 'Список записей аудита' })
  findAll(
    @Query('userId') userId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const parsedUserId = parseOptionalInt(userId);
    const parsedEntityId = parseOptionalInt(entityId);

    return this.auditService.findAll(
      {
        search,
        page: parseOptionalInt(page),
        limit: parseOptionalInt(limit),
        sort,
      },
      {
        userId: parsedUserId,
        entityType,
        entityId: parsedEntityId,
        action,
        from,
        to,
      },
    );
  }
}
