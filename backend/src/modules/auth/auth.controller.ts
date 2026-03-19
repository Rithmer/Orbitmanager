import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

const authThrottleOptions = {
  default: {
    ttl: () => parseInt(process.env['THROTTLE_AUTH_TTL'] ?? '60000', 10),
    limit: () => parseInt(process.env['THROTTLE_AUTH_LIMIT'] ?? '20', 10),
  },
} as const;

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle(authThrottleOptions)
  @ApiOperation({ summary: 'Регистрация нового пользователя' })
  @ApiResponse({
    status: 201,
    description: 'Пользователь зарегистрирован, токены выданы',
  })
  @ApiResponse({ status: 409, description: 'Логин уже занят' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle(authThrottleOptions)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Авторизация (получение токенов)' })
  @ApiResponse({ status: 200, description: 'Токены выданы' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Throttle(authThrottleOptions)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({ status: 200, description: 'Новая пара токенов' })
  @ApiResponse({ status: 401, description: 'Невалидный refresh-токен' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  getMe(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }
}
