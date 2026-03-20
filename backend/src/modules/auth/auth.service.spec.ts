import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  TooManyRequestsException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit-logs/audit.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { User } from '@/domain/models/user.model';

const hashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$hash';

const mockUser: User = {
  id: 1,
  login: 'testuser',
  password: hashedPassword,
  fullName: 'Test User',
  profession: 'Developer',
  accountStatus: 'active',
  accountRole: AccountRole.MEMBER,
  aiHintsEnabled: true,
  lastPasswordChangedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const mockUsersService = {
  findByLogin: jest.fn(),
  findEntityById: jest.fn(),
  findById: jest.fn(),
  create: jest.fn().mockResolvedValue({
    id: 1,
    login: 'newuser',
    accountRole: AccountRole.MEMBER,
    aiHintsEnabled: true,
  }),
  updatePassword: jest.fn().mockResolvedValue(undefined),
};

const mockJwtService = {
  signAsync: jest.fn().mockResolvedValue('mock-token'),
  verifyAsync: jest.fn().mockResolvedValue({
    sub: 1,
    login: 'testuser',
    accountRole: AccountRole.MEMBER,
  }),
};

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const map: Record<string, string> = {
      JWT_ACCESS_SECRET: 'access-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_ACCESS_EXPIRES_IN: '15m',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };
    return map[key];
  }),
};

const mockAuditService = {
  log: jest.fn().mockResolvedValue(undefined),
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      const map: Record<string, string> = {
        JWT_ACCESS_SECRET: 'access-secret',
        JWT_REFRESH_SECRET: 'refresh-secret',
        JWT_ACCESS_EXPIRES_IN: '15m',
        JWT_REFRESH_EXPIRES_IN: '7d',
      };
      return map[key];
    });
  });

  describe('register', () => {
    it('registers a new user and returns tokens', async () => {
      mockUsersService.findByLogin.mockResolvedValueOnce(null);
      mockJwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.register({
        login: 'newuser',
        password: 'password123',
        fullName: 'New User',
        profession: 'Dev',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockUsersService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          login: 'newuser',
          profession: 'Dev',
          accountRole: AccountRole.MEMBER,
        }),
      );
    });

    it('throws ConflictException if login is taken', async () => {
      mockUsersService.findByLogin.mockResolvedValueOnce(mockUser);

      await expect(
        service.register({
          login: 'testuser',
          password: 'password123',
          fullName: 'Dup',
          profession: 'Dev',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('returns tokens for valid credentials', async () => {
      const realHash = await argon2.hash('correctpassword');
      mockUsersService.findByLogin.mockResolvedValueOnce({
        ...mockUser,
        password: realHash,
      });
      mockJwtService.signAsync.mockResolvedValue('mock-token');

      const result = await service.login({
        login: 'testuser',
        password: 'correctpassword',
      });

      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(mockAuditService.log).toHaveBeenCalledWith(
        1,
        AuditAction.LOGIN,
        'user',
        1,
        expect.any(String),
      );
    });

    it('throws UnauthorizedException for wrong password', async () => {
      const realHash = await argon2.hash('correctpassword');
      mockUsersService.findByLogin.mockResolvedValueOnce({
        ...mockUser,
        password: realHash,
      });

      await expect(
        service.login({ login: 'testuser', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for non-existent user', async () => {
      mockUsersService.findByLogin.mockResolvedValueOnce(null);

      await expect(
        service.login({ login: 'nouser', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for blocked user', async () => {
      mockUsersService.findByLogin.mockResolvedValueOnce({
        ...mockUser,
        accountStatus: 'blocked',
      });

      await expect(
        service.login({ login: 'testuser', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException for inactive user', async () => {
      mockUsersService.findByLogin.mockResolvedValueOnce({
        ...mockUser,
        accountStatus: 'inactive',
      });

      await expect(
        service.login({ login: 'testuser', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('returns new token pair', async () => {
      mockUsersService.findEntityById.mockResolvedValueOnce(mockUser);
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refresh('valid-refresh-token');

      expect(result.accessToken).toBe('new-token');
      expect(result.refreshToken).toBe('new-token');
    });

    it('uses the current role from the database when issuing new tokens', async () => {
      mockUsersService.findEntityById.mockResolvedValueOnce({
        ...mockUser,
        accountRole: AccountRole.ADMIN,
      });
      mockJwtService.signAsync.mockResolvedValue('new-token');

      await service.refresh('valid-refresh-token');

      expect(mockJwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          sub: mockUser.id,
          login: mockUser.login,
          accountRole: AccountRole.ADMIN,
        }),
        expect.any(Object),
      );
    });

    it('throws UnauthorizedException for blocked user', async () => {
      mockUsersService.findEntityById.mockResolvedValueOnce({
        ...mockUser,
        accountStatus: 'blocked',
      });

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for deleted user', async () => {
      mockUsersService.findEntityById.mockResolvedValueOnce(null);

      await expect(service.refresh('valid-refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException for invalid token', async () => {
      mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('invalid'));

      await expect(service.refresh('bad-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('changePassword', () => {
    it('changes password when current password is valid', async () => {
      const realHash = await argon2.hash('CurrentPassword123!');
      mockUsersService.findEntityById.mockResolvedValueOnce({
        ...mockUser,
        password: realHash,
      });

      await service.changePassword(1, {
        currentPassword: 'CurrentPassword123!',
        newPassword: 'NewPassword123!',
      });

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith(
        1,
        'NewPassword123!',
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        1,
        AuditAction.UPDATE,
        'auth',
        1,
        'Пользователь изменил пароль',
      );
    });

    it('throws UnauthorizedException when current password is wrong', async () => {
      const realHash = await argon2.hash('CurrentPassword123!');
      mockUsersService.findEntityById.mockResolvedValueOnce({
        ...mockUser,
        password: realHash,
      });

      await expect(
        service.changePassword(1, {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws BadRequestException when new password matches current password', async () => {
      const realHash = await argon2.hash('CurrentPassword123!');
      mockUsersService.findEntityById.mockResolvedValueOnce({
        ...mockUser,
        password: realHash,
      });

      await expect(
        service.changePassword(1, {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'CurrentPassword123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws TooManyRequestsException when password was changed less than 24 hours ago', async () => {
      const realHash = await argon2.hash('CurrentPassword123!');
      mockUsersService.findEntityById.mockResolvedValueOnce({
        ...mockUser,
        password: realHash,
        lastPasswordChangedAt: new Date().toISOString(),
      });

      await expect(
        service.changePassword(1, {
          currentPassword: 'CurrentPassword123!',
          newPassword: 'NewPassword123!',
        }),
      ).rejects.toThrow(TooManyRequestsException);
    });
  });
});
