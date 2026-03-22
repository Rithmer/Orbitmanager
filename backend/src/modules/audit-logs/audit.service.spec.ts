import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditLog } from '@/domain/models/audit-log.model';

const makeLog = (overrides: Partial<AuditLog> = {}): AuditLog => ({
  id: 1,
  userId: 10,
  action: AuditAction.CREATE,
  entityType: 'project',
  entityId: 5,
  oldValue: null,
  newValue: null,
  timestamp: '2026-03-01T12:00:00.000Z',
  description: 'Создан проект',
  ...overrides,
});

const seedLogs: AuditLog[] = [
  makeLog({
    id: 1,
    userId: 10,
    action: AuditAction.CREATE,
    entityType: 'project',
    entityId: 1,
    timestamp: '2026-03-01T10:00:00.000Z',
  }),
  makeLog({
    id: 2,
    userId: 10,
    action: AuditAction.UPDATE,
    entityType: 'project',
    entityId: 1,
    timestamp: '2026-03-02T10:00:00.000Z',
  }),
  makeLog({
    id: 3,
    userId: 20,
    action: AuditAction.DELETE,
    entityType: 'task',
    entityId: 7,
    timestamp: '2026-03-03T10:00:00.000Z',
  }),
];

const paginated = (items: AuditLog[]) => ({
  items,
  total: items.length,
  page: 1,
  limit: 20,
  totalPages: 1,
});

const mockAuditLogRepository = {
  findPage: jest.fn().mockResolvedValue(paginated(seedLogs)),
  findById: jest.fn(),
  findByEntity: jest.fn(),
  create: jest
    .fn()
    .mockImplementation((data: Omit<AuditLog, 'id'>) =>
      Promise.resolve({ ...data, id: 99 }),
    ),
  createMany: jest.fn(),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: AUDIT_LOG_REPOSITORY, useValue: mockAuditLogRepository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  describe('log', () => {
    it('should create an audit record with correct fields', async () => {
      mockAuditLogRepository.create.mockResolvedValueOnce({ id: 99 });
      await service.log(
        10,
        AuditAction.CREATE,
        'project',
        3,
        'desc',
        'old',
        'new',
      );
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 10,
          action: AuditAction.CREATE,
          entityType: 'project',
          entityId: 3,
          description: 'desc',
          oldValue: 'old',
          newValue: 'new',
        }),
      );
    });

    it('should use null defaults when optional params omitted', async () => {
      mockAuditLogRepository.create.mockResolvedValueOnce({ id: 100 });
      await service.log(5, AuditAction.DELETE, 'team', 1);
      expect(mockAuditLogRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          oldValue: null,
          newValue: null,
          description: '',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('returns all logs when no filters applied', async () => {
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(seedLogs),
      );
      const result = await service.findAll({});
      expect(result.items).toHaveLength(3);
    });

    it('filters by userId', async () => {
      const filtered = seedLogs.filter((l) => l.userId === 10);
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll({}, { userId: 10 });
      expect(result.items.every((l) => l.userId === 10)).toBe(true);
      expect(result.items).toHaveLength(2);
    });

    it('filters by entityType', async () => {
      const filtered = seedLogs.filter((l) => l.entityType === 'task');
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll({}, { entityType: 'task' });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].entityType).toBe('task');
    });

    it('filters by entityId', async () => {
      const filtered = seedLogs.filter((l) => l.entityId === 7);
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll({}, { entityId: 7 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].entityId).toBe(7);
    });

    it('filters by action', async () => {
      const filtered = seedLogs.filter((l) => l.action === AuditAction.DELETE);
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll({}, { action: AuditAction.DELETE });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].action).toBe(AuditAction.DELETE);
    });

    it('filters by from date', async () => {
      const filtered = seedLogs.filter(
        (l) => l.timestamp >= '2026-03-02T00:00:00.000Z',
      );
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll(
        {},
        { from: '2026-03-02T00:00:00.000Z' },
      );
      expect(result.items.length).toBe(2);
    });

    it('filters by to date', async () => {
      const filtered = seedLogs.filter(
        (l) => l.timestamp <= '2026-03-01T23:59:59.000Z',
      );
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll(
        {},
        { to: '2026-03-01T23:59:59.000Z' },
      );
      expect(result.items.length).toBe(1);
    });

    it('combines multiple filters', async () => {
      const filtered = seedLogs.filter(
        (l) => l.userId === 10 && l.action === AuditAction.UPDATE,
      );
      mockAuditLogRepository.findPage.mockResolvedValueOnce(
        paginated(filtered),
      );
      const result = await service.findAll(
        {},
        { userId: 10, action: AuditAction.UPDATE },
      );
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe(2);
    });
  });
});
