import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ProjectAccessService } from '@/common/access/project-access.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { CalendarViewService } from './calendar-view.service';

const NOW = new Date('2026-03-15T12:00:00.000Z');

const makeProjectRecord = (overrides = {}) => ({
  id: 1,
  name: 'Project Alpha',
  teamId: 5,
  ...overrides,
});

const makeTaskRecord = (overrides = {}) => ({
  id: 10,
  projectId: 1,
  name: 'Fix bug',
  description: 'Critical fix',
  deadline: new Date('2026-03-20T00:00:00.000Z'),
  status: 'new',
  difficulty: 3,
  project: { id: 1, name: 'Project Alpha' },
  ...overrides,
});

const makeEventRecord = (overrides = {}) => ({
  id: 100,
  userId: 7,
  projectId: 1,
  taskId: null,
  title: 'Team Sync',
  description: 'Weekly sync',
  startDate: new Date('2026-03-10T09:00:00.000Z'),
  endDate: new Date('2026-03-10T10:00:00.000Z'),
  allDay: false,
  color: '#3b82f6',
  project: { id: 1, name: 'Project Alpha' },
  ...overrides,
});

const mockPrisma = {
  project: {
    findMany: jest.fn().mockResolvedValue([makeProjectRecord()]),
    findUnique: jest.fn().mockResolvedValue({
      id: 1,
      teamId: 5,
      name: 'Project Alpha',
      description: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
  },
  task: {
    findMany: jest.fn().mockResolvedValue([makeTaskRecord()]),
  },
  calendarEvent: {
    findMany: jest.fn().mockResolvedValue([makeEventRecord()]),
  },
};

const mockProjectAccessService = {
  getVisibleProjectIds: jest.fn().mockResolvedValue([1, 2]),
  assertProjectVisibility: jest.fn().mockResolvedValue(undefined),
};

async function buildService() {
  const module = await Test.createTestingModule({
    providers: [
      CalendarViewService,
      { provide: PrismaService, useValue: mockPrisma },
      { provide: ProjectAccessService, useValue: mockProjectAccessService },
    ],
  }).compile();

  return module.get(CalendarViewService);
}

describe('CalendarViewService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.project.findMany.mockResolvedValue([makeProjectRecord()]);
    mockPrisma.task.findMany.mockResolvedValue([makeTaskRecord()]);
    mockPrisma.calendarEvent.findMany.mockResolvedValue([makeEventRecord()]);
    mockPrisma.project.findUnique.mockResolvedValue({
      id: 1,
      teamId: 5,
      name: 'Project Alpha',
      description: '',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    mockProjectAccessService.getVisibleProjectIds.mockResolvedValue([1, 2]);
    mockProjectAccessService.assertProjectVisibility.mockResolvedValue(undefined);
  });

  describe('getMonthView', () => {
    it('returns projects, tasks and events for the requested month (MEMBER)', async () => {
      const service = await buildService();
      const result = await service.getMonthView(2026, 3, 7, AccountRole.MEMBER);

      expect(result.year).toBe(2026);
      expect(result.month).toBe(3);
      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].id).toBe(1);
      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].id).toBe(10);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].id).toBe(100);
    });

    it('passes userId to getVisibleProjectIds for non-admin users', async () => {
      const service = await buildService();
      await service.getMonthView(2026, 3, 42, AccountRole.MEMBER);

      expect(mockProjectAccessService.getVisibleProjectIds).toHaveBeenCalledWith(42);
    });

    it('skips getVisibleProjectIds for ADMIN and queries all projects', async () => {
      const service = await buildService();
      await service.getMonthView(2026, 3, 1, AccountRole.ADMIN);

      expect(mockProjectAccessService.getVisibleProjectIds).not.toHaveBeenCalled();
    });

    it('returns empty collections when there are no tasks or events in the month', async () => {
      mockPrisma.task.findMany.mockResolvedValue([]);
      mockPrisma.calendarEvent.findMany.mockResolvedValue([]);

      const service = await buildService();
      const result = await service.getMonthView(2026, 3, 7, AccountRole.MEMBER);

      expect(result.tasks).toHaveLength(0);
      expect(result.events).toHaveLength(0);
    });

    it('filters calendarEvent query by userId for MEMBER (not ADMIN)', async () => {
      const service = await buildService();
      await service.getMonthView(2026, 3, 7, AccountRole.MEMBER);

      const callArgs = mockPrisma.calendarEvent.findMany.mock.calls[0][0];
      expect(callArgs.where).toMatchObject({ userId: 7 });
    });

    it('does not filter calendarEvent query by userId for ADMIN', async () => {
      const service = await buildService();
      await service.getMonthView(2026, 3, 1, AccountRole.ADMIN);

      const callArgs = mockPrisma.calendarEvent.findMany.mock.calls[0][0];
      expect(callArgs.where).not.toHaveProperty('userId');
    });

    it('throws NotFoundException when a specific projectId is not found', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      const service = await buildService();
      await expect(
        service.getMonthView(2026, 3, 7, AccountRole.MEMBER, 999),
      ).rejects.toThrow(NotFoundException);
    });

    it('clamps month to valid range (1–12)', async () => {
      const service = await buildService();

      const resultLow = await service.getMonthView(2026, 0, 7, AccountRole.MEMBER);
      expect(resultLow.month).toBe(1);

      const resultHigh = await service.getMonthView(2026, 13, 7, AccountRole.MEMBER);
      expect(resultHigh.month).toBe(12);
    });
  });
});
