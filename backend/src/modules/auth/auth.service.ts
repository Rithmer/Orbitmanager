import {
  Injectable,
  Logger,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import type { StringValue } from 'ms';
import ms from 'ms';
import * as argon2 from 'argon2';
import { User } from '@/domain/models/user.model';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit-logs/audit.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { RegisterDto, LoginDto, ChangePasswordDto } from './dto';
import { JwtPayload } from './jwt.strategy';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const PASSWORD_CHANGE_COOLDOWN_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly prisma: PrismaService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair> {
    const existing = await this.usersService.findByLogin(dto.login);
    if (existing) {
      throw new ConflictException(`Логин "${dto.login}" уже занят`);
    }

    const user = await this.usersService.create({
      login: dto.login,
      password: dto.password,
      fullName: dto.fullName,
      profession: dto.profession ?? '',
      accountRole: AccountRole.MEMBER,
    });

    return this.generateTokens(
      { sub: user.id, login: user.login, accountRole: user.accountRole },
      user.id,
    );
  }

  async login(dto: LoginDto): Promise<TokenPair> {
    const user = await this.usersService.findByLogin(dto.login);
    if (!user) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Аккаунт недоступен для входа');
    }

    const valid = await argon2.verify(user.password, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Неверный логин или пароль');
    }

    await this.auditService.log(
      user.id,
      AuditAction.LOGIN,
      'user',
      user.id,
      `Пользователь "${user.login}" вошёл в систему`,
    );

    return this.generateTokens(
      { sub: user.id, login: user.login, accountRole: user.accountRole },
      user.id,
    );
  }

  async getMe(
    userId: number,
  ): Promise<Omit<User, 'password' | 'lastPasswordChangedAt'>> {
    return this.usersService.findById(userId);
  }

  async changePassword(userId: number, dto: ChangePasswordDto): Promise<void> {
    const user = await this.usersService.findEntityById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }

    const currentPasswordMatches = await argon2.verify(
      user.password,
      dto.currentPassword,
    );
    if (!currentPasswordMatches) {
      throw new UnauthorizedException('Текущий пароль указан неверно');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'Новый пароль должен отличаться от текущего',
      );
    }

    if (user.lastPasswordChangedAt) {
      const lastChangedAt = Date.parse(user.lastPasswordChangedAt);
      if (Number.isFinite(lastChangedAt)) {
        const nextAllowedAt = lastChangedAt + PASSWORD_CHANGE_COOLDOWN_MS;
        if (Date.now() < nextAllowedAt) {
          throw new HttpException(
            `Пароль можно менять только один раз в 24 часа. Следующая смена будет доступна ${new Date(nextAllowedAt).toISOString()}.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      } else {
        // B-05: lastPasswordChangedAt exists but is not a valid date string —
        // cooldown check is skipped; log so the data corruption is detectable
        this.logger.warn(
          `User #${userId} has an invalid lastPasswordChangedAt value: ` +
            `"${user.lastPasswordChangedAt}". Password change cooldown check skipped.`,
        );
      }
    }

    await this.usersService.updatePassword(userId, dto.newPassword);
    await this.auditService.log(
      userId,
      AuditAction.UPDATE,
      'auth',
      userId,
      'Пользователь изменил пароль',
    );
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Невалидный refresh-токен');
    }

    const hash = hashToken(refreshToken);
    const revokeResult = await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    if (revokeResult.count === 0) {
      throw new UnauthorizedException('Токен отозван или не найден');
    }

    const user = await this.usersService.findEntityById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (user.accountStatus !== 'active') {
      throw new UnauthorizedException('Аккаунт недоступен для входа');
    }

    return this.generateTokens(
      { sub: user.id, login: user.login, accountRole: user.accountRole },
      user.id,
    );
  }

  async logout(refreshToken: string): Promise<void> {
    const hash = hashToken(refreshToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async generateTokens(
    payload: JwtPayload,
    userId: number,
  ): Promise<TokenPair> {
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const accessTokenPayload = {
      sub: payload.sub,
      login: payload.login,
      accountRole: payload.accountRole,
    };
    const refreshTokenPayload = {
      ...accessTokenPayload,
      tokenId: randomUUID(),
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessTokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as StringValue,
      }),
      this.jwtService.signAsync(refreshTokenPayload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: refreshExpiresIn as StringValue,
      }),
    ]);

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(
          Date.now() + ms(refreshExpiresIn as ms.StringValue),
        ),
      },
    });

    return { accessToken, refreshToken };
  }
}
