import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiAuth } from '@/common/decorators/api-auth.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';
import { parseOptionalInt } from '@/common/helpers/query.helper';
import { ReportsService } from './reports.service';
import { ReportsSummaryResponseDto } from './dto/reports-summary-response.dto';

@ApiTags('Reports')
@ApiAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Получить сводку отчетов' })
  @ApiResponse({
    status: 200,
    description: 'Сводка отчетов',
    type: ReportsSummaryResponseDto,
  })
  getSummary(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') accountRole: AccountRole,
    @Query('projectId') projectId?: string,
  ) {
    return this.reportsService.getSummary(
      userId,
      accountRole,
      parseOptionalInt(projectId),
    );
  }

  @Get('projects')
  @ApiOperation({ summary: 'Получить доступные проекты для аналитики' })
  @ApiResponse({ status: 200, description: 'Список проектов' })
  getProjects(
    @CurrentUser('id') userId: number,
    @CurrentUser('accountRole') accountRole: AccountRole,
  ) {
    return this.reportsService.getAccessibleProjects(userId, accountRole);
  }
}
