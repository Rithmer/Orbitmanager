import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshDto, ChangePasswordDto } from './dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';

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

  @Public()
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

  @Public()
  @Post('login')
  @Throttle(authThrottleOptions)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Авторизация (получение токенов)' })
  @ApiResponse({ status: 200, description: 'Токены выданы' })
  @ApiResponse({ status: 401, description: 'Неверный логин или пароль' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @Throttle(authThrottleOptions)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Обновление токенов' })
  @ApiResponse({ status: 200, description: 'Новая пара токенов' })
  @ApiResponse({ status: 401, description: 'Невалидный refresh-токен' })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Выход из системы (отзыв refresh-токена)' })
  @ApiResponse({ status: 204, description: 'Токен отозван' })
  logout(@Body() dto: RefreshDto): Promise<void> {
    return this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Получить профиль текущего пользователя' })
  @ApiResponse({ status: 200, description: 'Профиль пользователя' })
  @ApiResponse({ status: 401, description: 'Не авторизован' })
  getMe(@CurrentUser('id') userId: number) {
    return this.authService.getMe(userId);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Изменить пароль текущего пользователя' })
  @ApiResponse({ status: 204, description: 'Пароль успешно изменён' })
  @ApiResponse({ status: 400, description: 'Некорректный новый пароль' })
  @ApiResponse({ status: 401, description: 'Текущий пароль неверен' })
  @ApiResponse({
    status: 429,
    description: 'Смена пароля доступна не чаще одного раза за 24 часа',
  })
  changePassword(
    @CurrentUser('id') userId: number,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(userId, dto);
  }
}
