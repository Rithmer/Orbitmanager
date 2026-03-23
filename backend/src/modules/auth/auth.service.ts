import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import type { StringValue } from 'ms';
import ms from 'ms';
import * as argon2 from 'argon2';
import { User } from '@/domain/models/user.model';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit-logs/audit.service';
import { PrismaService } from '@/infrastructure/prisma/prisma.service';
import { AccountRole } from '@/common/enums/account-role.enum';
import { AuditAction } from '@/common/enums/audit-action.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
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
      profession: dto.profession,
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

    if (user.accountStatus === 'blocked') {
      throw new UnauthorizedException('Аккаунт заблокирован');
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

  async getMe(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('Пользователь не найден');
    }
    return user;
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
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hash },
    });

    if (!stored || stored.revokedAt !== null) {
      throw new UnauthorizedException('Токен отозван или не найден');
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash: hash },
      data: { revokedAt: new Date() },
    });

    const user = await this.usersService.findEntityById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    if (user.accountStatus === 'blocked') {
      throw new UnauthorizedException('Аккаунт заблокирован');
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
    const tokenPayload = {
      sub: payload.sub,
      login: payload.login,
      accountRole: payload.accountRole,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: accessExpiresIn as StringValue,
      }),
      this.jwtService.signAsync(tokenPayload, {
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
