import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Проверка работоспособности сервиса' })
  @ApiResponse({ status: 200, description: 'Сервис работает' })
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health/live')
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Приложение принимает запросы' })
  getLiveHealth() {
    return this.appService.getLiveHealth();
  }

  @Get('health/ready')
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Приложение и база данных готовы' })
  @ApiResponse({ status: 503, description: 'База данных недоступна' })
  getReadyHealth() {
    return this.appService.getReadyHealth();
  }
}
