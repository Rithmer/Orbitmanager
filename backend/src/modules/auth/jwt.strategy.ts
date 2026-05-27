import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { AuthenticatedUser } from '@/common/auth/authenticated-user.interface';
import { AccountRole } from '@/common/enums/account-role.enum';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: number;
  login: string;
  accountRole: AccountRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const secret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      login: payload.login,
      accountRole: payload.accountRole,
    };
  }
}
