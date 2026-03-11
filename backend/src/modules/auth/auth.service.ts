import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { StringValue } from 'ms';
import * as argon2 from 'argon2';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit-logs/audit.service';
import { AccountRole } from '../../common/enums/account-role.enum';
import { AuditAction } from '../../common/enums/audit-action.enum';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt.strategy';

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

    return this.generateTokens({
      sub: user.id,
      login: user.login,
      accountRole: user.accountRole,
    });
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

    await this.auditService.log(user.id, AuditAction.LOGIN, 'user', user.id, `Пользователь "${user.login}" вошёл в систему`);

    return this.generateTokens({
      sub: user.id,
      login: user.login,
      accountRole: user.accountRole,
    });
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

    const user = await this.usersService.findByLogin(payload.login);
    if (!user) {
      throw new UnauthorizedException('Пользователь не найден');
    }

    return this.generateTokens({
      sub: payload.sub,
      login: payload.login,
      accountRole: payload.accountRole,
    });
  }

  private async generateTokens(payload: JwtPayload): Promise<TokenPair> {
    const accessExpiresIn = this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ?? '15m';
    const refreshExpiresIn = this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';
    const tokenPayload = { sub: payload.sub, login: payload.login, accountRole: payload.accountRole };

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

    return { accessToken, refreshToken };
  }
}
