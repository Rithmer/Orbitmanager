import { ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

describe('AppService', () => {
  describe('getHealth', () => {
    it('returns status, timestamp, and uptime', () => {
      const service = new AppService();

      const result = service.getHealth();

      expect(result.status).toBe('ok');
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.uptime).toBe('number');
    });
  });

  describe('getLiveHealth', () => {
    it('delegates to health payload', () => {
      const service = new AppService();

      const result = service.getLiveHealth();

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
    });
  });

  describe('getReadyHealth', () => {
    it('returns database up when prisma check passes', async () => {
      const prisma = {
        checkConnection: jest.fn().mockResolvedValue(undefined),
      };
      const service = new AppService(prisma as never);

      await expect(service.getReadyHealth()).resolves.toMatchObject({
        status: 'ok',
        checks: {
          database: 'up',
        },
      });
      expect(prisma.checkConnection).toHaveBeenCalledTimes(1);
    });

    it('returns database up when prisma is not configured', async () => {
      const service = new AppService();

      await expect(service.getReadyHealth()).resolves.toMatchObject({
        status: 'ok',
        checks: {
          database: 'up',
        },
      });
    });

    it('throws ServiceUnavailableException when prisma check fails', async () => {
      const prisma = {
        checkConnection: jest.fn().mockRejectedValue(new Error('db down')),
      };
      const service = new AppService(prisma as never);

      let thrown: unknown;
      try {
        await service.getReadyHealth();
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(ServiceUnavailableException);
      expect(
        (thrown as ServiceUnavailableException).getResponse(),
      ).toMatchObject({
        status: 'error',
        checks: {
          database: 'down',
        },
      });
      expect(prisma.checkConnection).toHaveBeenCalledTimes(1);
    });
  });
});
