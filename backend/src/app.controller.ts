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
}
