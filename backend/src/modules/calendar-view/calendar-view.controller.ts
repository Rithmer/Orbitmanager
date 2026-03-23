import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { parseOptionalInt } from '@/common/helpers/query.helper';
import { CalendarViewService } from './calendar-view.service';
import { CalendarMonthViewResponseDto } from './calendar-view.types';

@ApiTags('Calendar Month View')
@ApiAuth()
@UseGuards(AccountRolesGuard)
@Controller('calendar')
export class CalendarViewController {
  constructor(private readonly calendarViewService: CalendarViewService) {}

  @Get('month-view')
  @Roles(AccountRole.ADMIN, AccountRole.MEMBER)
  @ApiOperation({ summary: 'Получить month view календаря' })
  @ApiQuery({ name: 'year', required: true, type: Number })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'projectId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Month view календаря', type: CalendarMonthViewResponseDto })
  getMonthView(
    @Query('year') yearParam: string,
    @Query('month') monthParam: string,
    @Query('projectId') projectIdParam: string | undefined,
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') accountRole: AccountRole,
  ): Promise<CalendarMonthViewResponseDto> {
    const currentYear = parseOptionalInt(yearParam) ?? new Date().getFullYear();
    const currentMonth = parseOptionalInt(monthParam) ?? new Date().getMonth() + 1;
    const projectId = parseOptionalInt(projectIdParam);

    return this.calendarViewService.getMonthView(
      currentYear,
      currentMonth,
      userId,
      accountRole,
      projectId,
    );
  }
}
