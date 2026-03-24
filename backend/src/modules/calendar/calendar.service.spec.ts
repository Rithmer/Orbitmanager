import { Test } from '@nestjs/testing';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { CALENDAR_EVENT_REPOSITORY } from '@/domain/repositories/calendar-event.repository';
import { AuditService } from '../audit-logs/audit.service';
import { CalendarService } from './calendar.service';

const mockEvent = {
  id: 1,
  userId: 10,
  projectId: null,
  taskId: null,
  title: 'Team Meeting',
  description: 'Monthly sync',
  startDate: '2026-03-01T10:00:00.000Z',
  endDate: '2026-03-01T11:00:00.000Z',
  allDay: false,
  color: '#3b82f6',
  createdAt: '2026-03-01T09:00:00.000Z',
  updatedAt: '2026-03-01T09:00:00.000Z',
};

const mockCalendarEventRepository = {
  findPage: jest.fn().mockResolvedValue({ items: [mockEvent], total: 1 }),
  findAll: jest.fn().mockResolvedValue([mockEvent]),
  findById: jest.fn().mockResolvedValue(mockEvent),
  findByUser: jest.fn().mockResolvedValue([mockEvent]),
  findByProject: jest.fn().mockResolvedValue([mockEvent]),
  findByTask: jest.fn().mockResolvedValue([]),
  findByDateRange: jest.fn().mockResolvedValue([mockEvent]),
  create: jest.fn().mockResolvedValue(mockEvent),
  update: jest.fn().mockResolvedValue(mockEvent),
  delete: jest.fn().mockResolvedValue(true),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('CalendarService', () => {
  let service: CalendarService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        CalendarService,
        { provide: CALENDAR_EVENT_REPOSITORY, useValue: mockCalendarEventRepository },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get(CalendarService);
  });

  describe('findAll()', () => {
    it('returns paginated list with correct structure for ADMIN', async () => {
      const result = await service.findAll(
        { page: 1, limit: 10 },
        99,
        AccountRole.ADMIN,
      );

      expect(result).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        limit: 10,
        totalPages: expect.any(Number),
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({ id: 1, title: 'Team Meeting' });
    });
  });

  describe('create()', () => {
    it('throws BadRequestException when endDate <= startDate', async () => {
      const dto = {
        title: 'Invalid Event',
        description: 'bad dates',
        startDate: '2026-03-01T11:00:00.000Z',
        endDate: '2026-03-01T10:00:00.000Z',
        allDay: false,
      };

      await expect(service.create(dto, 10)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when endDate equals startDate', async () => {
      const dto = {
        title: 'Same Time',
        description: '',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T10:00:00.000Z',
        allDay: false,
      };

      await expect(service.create(dto, 10)).rejects.toThrow(BadRequestException);
    });

    it('returns created event and calls auditService.log', async () => {
      const dto = {
        title: 'Team Meeting',
        description: 'Monthly sync',
        startDate: '2026-03-01T10:00:00.000Z',
        endDate: '2026-03-01T11:00:00.000Z',
        allDay: false,
      };

      const result = await service.create(dto, 10);

      expect(result).toMatchObject({ id: 1, title: 'Team Meeting' });
      expect(mockCalendarEventRepository.create).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        10,
        expect.any(String),
        'calendar_event',
        mockEvent.id,
        expect.any(String),
      );
    });
  });

  describe('remove()', () => {
    it('throws NotFoundException when event not found', async () => {
      mockCalendarEventRepository.findById.mockResolvedValueOnce(null);

      await expect(service.remove(999, 10, AccountRole.ADMIN)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws ForbiddenException when non-owner non-admin tries to delete', async () => {
      const otherUsersEvent = { ...mockEvent, userId: 99 };
      mockCalendarEventRepository.findById.mockResolvedValueOnce(otherUsersEvent);

      await expect(service.remove(1, 10, AccountRole.MEMBER)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('deletes the event and calls auditService.log when owner removes own event', async () => {
      await service.remove(1, 10, AccountRole.MEMBER);

      expect(mockCalendarEventRepository.delete).toHaveBeenCalledWith(1);
      expect(mockAuditService.log).toHaveBeenCalledTimes(1);
    });
  });
});
