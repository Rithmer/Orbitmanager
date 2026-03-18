import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, ConflictException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit-logs/audit.service';

const hashedPassword = '$argon2id$v=19$m=65536,t=3,p=4$hash';

const mockUser = {
  id: 1,
  login: 'testuser',
  password: hashedPassword,
  fullName: 'Test User',
  profession: 'Developer',
  accountStatus: 'active',
  accountRole: AccountRole.MEMBER,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const mockUsersService = {
  findByLogin: jest.fn(),
  findEntityById: jest.fn(),
  create: jest.fn().mockResolvedValue({
    id: 1,
    login: 'newuser',
    accountRole: AccountRole.MEMBER,
  }),
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
  });

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
    expect(mockUsersService.create).toHaveBeenCalled();
  });

  it('throws conflict when login is taken during register', async () => {
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
  });

  it('throws unauthorized for wrong password', async () => {
    const realHash = await argon2.hash('correctpassword');
    mockUsersService.findByLogin.mockResolvedValueOnce({
      ...mockUser,
      password: realHash,
    });

    await expect(
      service.login({ login: 'testuser', password: 'wrongpassword' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws unauthorized for blocked user on login', async () => {
    mockUsersService.findByLogin.mockResolvedValueOnce({
      ...mockUser,
      accountStatus: 'blocked',
    });

    await expect(
      service.login({ login: 'testuser', password: 'pass' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('issues refresh tokens with current role from database', async () => {
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

  it('throws unauthorized for invalid refresh token', async () => {
    mockJwtService.verifyAsync.mockRejectedValueOnce(new Error('invalid'));

    await expect(service.refresh('bad-token')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
