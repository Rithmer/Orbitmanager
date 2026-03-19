import {
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { PrismaService } from './infrastructure/prisma/prisma.service';

@Injectable()
export class AppService {
  constructor(@Optional() private readonly prisma?: PrismaService) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  getLiveHealth() {
    return this.getHealth();
  }

  async getReadyHealth() {
    try {
      if (this.prisma) {
        await this.prisma.checkConnection();
      }

      return {
        ...this.getHealth(),
        checks: {
          database: 'up',
        },
      };
    } catch {
      throw new ServiceUnavailableException({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: 'down',
        },
      });
    }
  }
}
