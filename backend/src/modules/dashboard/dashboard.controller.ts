import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Получить сводку дашборда' })
  @ApiResponse({ status: 200, description: 'Сводка дашборда' })
  getSummary(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') accountRole: AccountRole,
  ) {
    return this.dashboardService.getSummary(userId, accountRole);
  }
}
