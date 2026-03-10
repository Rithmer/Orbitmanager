import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { USER_REPOSITORY } from '../../domain/repositories/user.repository';
import { AccountRole } from '../../common/enums/account-role.enum';
import { User } from '../../domain/models/user.model';

const mockUser: User = {
  id: 1,
  login: 'testuser',
  password: '$argon2id$hash',
  fullName: 'Test User',
  profession: 'Developer',
  accountStatus: 'active',
  accountRole: AccountRole.MEMBER,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockUserRepository = {
  findAll: jest.fn().mockResolvedValue([mockUser]),
  findById: jest.fn().mockResolvedValue(mockUser),
  findByLogin: jest.fn().mockResolvedValue(null),
  create: jest.fn().mockImplementation((data: Omit<User, 'id'>) =>
    Promise.resolve({ ...data, id: 2 }),
  ),
  update: jest.fn().mockImplementation((id: number, partial: Partial<User>) =>
    Promise.resolve({ ...mockUser, ...partial }),
  ),
  delete: jest.fn().mockResolvedValue(true),
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: USER_REPOSITORY, useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users without passwords', async () => {
      const result = await service.findAll({});
      expect(result.items).toHaveLength(1);
      expect((result.items[0] as Record<string, unknown>)['password']).toBeUndefined();
    });
  });

  describe('findById', () => {
    it('should return user without password', async () => {
      const result = await service.findById(1);
      expect(result.login).toBe('testuser');
      expect((result as Record<string, unknown>)['password']).toBeUndefined();
    });

    it('should throw NotFoundException for missing user', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('should create user and return without password', async () => {
      const result = await service.create({
        login: 'newuser',
        password: 'password123',
        fullName: 'New User',
        profession: 'Tester',
      });
      expect(result.id).toBe(2);
      expect((result as Record<string, unknown>)['password']).toBeUndefined();
      expect(mockUserRepository.create).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate login', async () => {
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
    it('should update and return user without password', async () => {
      const result = await service.update(1, { fullName: 'Updated' });
      expect(result.fullName).toBe('Updated');
      expect((result as Record<string, unknown>)['password']).toBeUndefined();
    });

    it('should throw NotFoundException for missing user', async () => {
      mockUserRepository.findById.mockResolvedValueOnce(null);
      await expect(service.update(999, { fullName: 'X' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete user', async () => {
      await service.remove(1);
      expect(mockUserRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if not found', async () => {
      mockUserRepository.delete.mockResolvedValueOnce(false);
      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
