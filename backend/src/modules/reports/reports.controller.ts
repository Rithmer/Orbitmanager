import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Получить сводку отчетов' })
  @ApiResponse({ status: 200, description: 'Сводка отчетов' })
  getSummary(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') accountRole: AccountRole,
  ) {
    return this.reportsService.getSummary(userId, accountRole);
  }
}
