import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  TooManyRequestsException,
} from '@nestjs/common';
import { TtlCacheService } from '@/common/cache/ttl-cache.service';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from '@/domain/repositories/user.repository';
import { TEAM_REPOSITORY } from '@/domain/repositories/team.repository';
import { TASK_REPOSITORY } from '@/domain/repositories/task.repository';
import { AUDIT_LOG_REPOSITORY } from '@/domain/repositories/audit-log.repository';
import { AuditService } from '../audit-logs/audit.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { User } from '@/domain/models/user.model';

const mockUser: User = {
  id: 1,
  login: 'testuser',
  password: '$argon2id$hash',
  fullName: 'Test User',
  profession: 'Developer',
  accountStatus: 'active',
  accountRole: AccountRole.MEMBER,
  aiHintsEnabled: true,
  lastPasswordChangedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockUserRepository = {
  findAll: jest.fn().mockResolvedValue([mockUser]),
  findById: jest.fn().mockResolvedValue(mockUser),
  findPage: jest.fn().mockResolvedValue({
    items: [mockUser],
    total: 1,
  }),
  findByLogin: jest.fn().mockResolvedValue(null),
  create: jest
    .fn()
    .mockImplementation((data: Omit<User, 'id'>) =>
      Promise.resolve({ ...data, id: 2 }),
    ),
  update: jest
    .fn()
    .mockImplementation((id: number, partial: Partial<User>) =>
      Promise.resolve({ ...mockUser, ...partial, id }),
    ),
  delete: jest.fn().mockResolvedValue(true),
};

const mockTeamRepository = {
  findByCreator: jest.fn().mockResolvedValue([]),
};

const mockTaskRepository = {
  findByCreator: jest.fn().mockResolvedValue([]),
};

const mockAuditLogRepository = {
  findByUser: jest.fn().mockResolvedValue([]),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

const cacheStore = new Map<string, unknown>();
const mockCacheService = {
  get: jest.fn((key: string) => cacheStore.get(key)),
  set: jest.fn((key: string, value: unknown) => {
    cacheStore.set(key, value);
  }),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
        { provide: TEAM_REPOSITORY, useValue: mockTeamRepository },
        { provide: TASK_REPOSITORY, useValue: mockTaskRepository },
        { provide: AUDIT_LOG_REPOSITORY, useValue: mockAuditLogRepository },
        { provide: AuditService, useValue: mockAuditService },
        { provide: TtlCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
    cacheStore.clear();
    mockUserRepository.findById.mockResolvedValue(mockUser);
    mockUserRepository.findPage.mockResolvedValue({
      items: [mockUser],
      total: 1,
    });
    mockUserRepository.update.mockImplementation(
      (id: number, partial: Partial<User>) =>
        Promise.resolve({ ...mockUser, ...partial, id }),
    );
    mockUserRepository.findByLogin.mockResolvedValue(null);
    mockUserRepository.delete.mockResolvedValue(true);
    mockTeamRepository.findByCreator.mockResolvedValue([]);
    mockTaskRepository.findByCreator.mockResolvedValue([]);
    mockAuditLogRepository.findByUser.mockResolvedValue([]);
  });

  describe('findAll', () => {
    it('returns paginated users without sensitive fields', async () => {
      const result = await service.findAll({});

      expect(result.items).toHaveLength(1);
      expect(
        (result.items[0] as Record<string, unknown>)['password'],
      ).toBeUndefined();
      expect(
        (result.items[0] as Record<string, unknown>)['lastPasswordChangedAt'],
      ).toBeUndefined();
      expect(mockUserRepository.findPage).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 20,
        }),
      );
    });
  });

  describe('findById', () => {
    it('returns user without sensitive fields', async () => {
      const result = await service.findById(1);

      expect(result.login).toBe('testuser');
      expect((result as Record<string, unknown>)['password']).toBeUndefined();
      expect(
        (result as Record<string, unknown>)['lastPasswordChangedAt'],
      ).toBeUndefined();
    });

    it('throws NotFoundException for missing user', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findEntityById', () => {
    it('returns full user entity for internal flows', async () => {
      const result = await service.findEntityById(1);

      expect(result).toEqual(mockUser);
    });
  });

  describe('create', () => {
    it('creates user and returns public representation', async () => {
      const result = await service.create({
        login: 'newuser',
        password: 'password123',
        fullName: 'New User',
        profession: 'Tester',
      });

      expect(result.id).toBe(2);
      expect((result as Record<string, unknown>)['password']).toBeUndefined();
      expect(
        (result as Record<string, unknown>)['lastPasswordChangedAt'],
      ).toBeUndefined();
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          login: 'newuser',
          profession: 'Tester',
          aiHintsEnabled: true,
          lastPasswordChangedAt: null,
        }),
      );
    });

    it('throws ConflictException for duplicate login', async () => {
      mockUserRepository.findByLogin.mockResolvedValueOnce(mockUser);

      await expect(
        service.create({
          login: 'testuser',
          password: 'password123',
          fullName: 'Dup',
          profession: 'Dev',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('updates user and returns public representation', async () => {
      const result = await service.update(1, { fullName: 'Updated' });

      expect(result.fullName).toBe('Updated');
      expect((result as Record<string, unknown>)['password']).toBeUndefined();
    });

    it('throws NotFoundException for missing user', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(service.update(999, { fullName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateMe', () => {
    it('updates personal settings and writes audit log', async () => {
      const result = await service.updateMe(1, {
        fullName: 'Updated Name',
        aiHintsEnabled: false,
      });

      expect(result.fullName).toBe('Updated Name');
      expect(result.aiHintsEnabled).toBe(false);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        1,
        AuditAction.UPDATE,
        'user-profile',
        1,
        'Пользователь обновил личные настройки',
      );
    });

    it('throws TooManyRequestsException after 5 changes in 5 minutes', async () => {
      for (let index = 0; index < 5; index += 1) {
        await service.updateMe(1, { profession: `Role ${index}` });
      }

      await expect(
        service.updateMe(1, { profession: 'One more role' }),
      ).rejects.toThrow(TooManyRequestsException);
    });
  });

  describe('updatePassword', () => {
    it('stores hashed password and change timestamp', async () => {
      await service.updatePassword(1, 'NewPassword123!');

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          password: expect.stringContaining('$argon2'),
          lastPasswordChangedAt: expect.any(String),
          updatedAt: expect.any(String),
        }),
      );
    });
  });

  describe('remove', () => {
    it('deletes user when there are no blocking dependencies', async () => {
      await service.remove(1);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('throws NotFoundException if user does not exist', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });

    it('throws ConflictException when user created teams', async () => {
      mockTeamRepository.findByCreator.mockResolvedValueOnce([
        { id: 5, name: 'Blocked team' },
      ]);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException when user created tasks', async () => {
      mockTaskRepository.findByCreator.mockResolvedValueOnce([
        { id: 10, name: 'Blocked task' },
      ]);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('throws ConflictException when user has audit logs', async () => {
      mockAuditLogRepository.findByUser.mockResolvedValueOnce([
        { id: 7, userId: 1, action: 'login' },
      ]);

      await expect(service.remove(1)).rejects.toThrow(ConflictException);
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFoundException if delete lost the race', async () => {
      mockUserRepository.delete.mockResolvedValueOnce(false);

      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
      expect(mockAuditService.log).not.toHaveBeenCalled();
    });
  });
});
