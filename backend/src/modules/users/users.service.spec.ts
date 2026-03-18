import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { createPrismaMock, type PrismaMock } from '@/test-utils/mock-prisma';
import { AuditService } from '../audit-logs/audit.service';
import { UsersService } from './users.service';

const mockUser = {
  id: 1,
  login: 'testuser',
  password: '$argon2id$hash',
  fullName: 'Test User',
  profession: 'Developer',
  accountStatus: 'active',
  accountRole: 'member',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaMock;

  const mockAuditService = {
    log: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    prisma = createPrismaMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('returns paginated users without password', async () => {
    prisma.user.count.mockResolvedValueOnce(1);
    prisma.user.findMany.mockResolvedValueOnce([mockUser]);

    const result = await service.findAll({});

    expect(result.items).toHaveLength(1);
    expect((result.items[0] as Record<string, unknown>)['password']).toBeUndefined();
  });

  it('returns internal entity with password for auth flows', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);

    const result = await service.findEntityById(1);

    expect(result).toEqual(mockUser);
  });

  it('creates a user and omits password from response', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);
    prisma.user.create.mockResolvedValueOnce({ ...mockUser, id: 2, login: 'newuser' });

    const result = await service.create({
      login: 'newuser',
      password: 'password123',
      fullName: 'New User',
      profession: 'Tester',
    });

    expect(result.id).toBe(2);
    expect((result as Record<string, unknown>)['password']).toBeUndefined();
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it('throws conflict on duplicate login', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);

    await expect(
      service.create({
        login: 'testuser',
        password: 'password123',
        fullName: 'Dup',
        profession: 'Dev',
      }),
    ).rejects.toThrow(ConflictException);
  });

  it('updates user and hashes password when provided', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);
    prisma.user.update.mockResolvedValueOnce({ ...mockUser, fullName: 'Updated' });

    const result = await service.update(1, {
      fullName: 'Updated',
      password: 'newpass123',
    });

    expect(result.fullName).toBe('Updated');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('throws not found when updating missing user', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(null);

    await expect(service.update(999, { fullName: 'X' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('blocks deletion when user has dependent data', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);
    prisma.team.count.mockResolvedValueOnce(1);
    prisma.task.count.mockResolvedValueOnce(0);
    prisma.auditLog.count.mockResolvedValueOnce(0);

    await expect(service.remove(1)).rejects.toThrow(ConflictException);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });

  it('deletes user when there are no blocking dependencies', async () => {
    prisma.user.findUnique.mockResolvedValueOnce(mockUser);
    prisma.team.count.mockResolvedValueOnce(0);
    prisma.task.count.mockResolvedValueOnce(0);
    prisma.auditLog.count.mockResolvedValueOnce(0);
    prisma.user.delete.mockResolvedValueOnce(mockUser);

    await service.remove(1);

    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockAuditService.log).toHaveBeenCalled();
  });
});
