import { Test, TestingModule } from '@nestjs/testing';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { AuditService } from './audit.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaMock;

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
    jest.clearAllMocks();
  });

  it('creates audit records with normalized optional values', async () => {
    prisma.auditLog.create.mockResolvedValueOnce({ id: 1 });

    await service.log(10, AuditAction.CREATE, 'project', 5);

    expect(prisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 10,
          action: AuditAction.CREATE,
          entityType: 'project',
          entityId: 5,
          oldValue: null,
          newValue: null,
          description: '',
        }),
      }),
    );
  });

  it('applies filters, pagination and sorting via prisma query', async () => {
    prisma.auditLog.count.mockResolvedValueOnce(1);
    prisma.auditLog.findMany.mockResolvedValueOnce([
      {
        id: 2,
        userId: 10,
        action: AuditAction.UPDATE,
        entityType: 'project',
        entityId: 5,
        oldValue: null,
        newValue: null,
        timestamp: new Date('2026-03-02T10:00:00.000Z'),
        description: 'Updated',
      },
    ]);

    const result = await service.findAll({
      userId: 10,
      action: AuditAction.UPDATE,
      search: 'upd',
      page: 2,
      limit: 5,
      sort: '-timestamp',
    });

    expect(prisma.auditLog.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 10,
          action: AuditAction.UPDATE,
          OR: expect.any(Array),
        }),
      }),
    );
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: { timestamp: 'desc' },
      }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(result.page).toBe(2);
  });
});
