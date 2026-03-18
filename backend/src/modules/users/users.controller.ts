import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { AccountRolesGuard } from '@/common/guards/account-roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { AccountRole } from '@/common/enums/account-role.enum';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, AccountRolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Получить список пользователей' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sort', required: false })
  @ApiQuery({ name: 'accountRole', required: false, enum: AccountRole })
  @ApiResponse({ status: 200, description: 'Список пользователей' })
  findAll(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
    @Query('accountRole') accountRole?: string,
  ) {
    return this.usersService.findAll({
      search,
      sort,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      filters: accountRole ? { accountRole } : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить пользователя по ID' })
  @ApiResponse({ status: 200, description: 'Пользователь найден' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findById(id);
  }

  @Post()
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Создать пользователя (только admin)' })
  @ApiResponse({ status: 201, description: 'Пользователь создан' })
  @ApiResponse({ status: 409, description: 'Логин уже занят' })
  create(@CurrentUser('id') callerId: number, @Body() dto: CreateUserDto) {
    return this.usersService.create(dto, callerId);
  }

  @Patch(':id')
  @Roles(AccountRole.ADMIN)
  @ApiOperation({ summary: 'Обновить пользователя (только admin)' })
  @ApiResponse({ status: 200, description: 'Пользователь обновлён' })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  update(
    @CurrentUser('id') callerId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto, callerId);
  }

  @Delete(':id')
  @Roles(AccountRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить пользователя (только admin)' })
  @ApiResponse({ status: 204, description: 'Пользователь удалён' })
  @ApiResponse({
    status: 409,
    description: 'Пользователь имеет зависимые записи',
  })
  @ApiResponse({ status: 404, description: 'Пользователь не найден' })
  remove(
    @CurrentUser('id') callerId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.remove(id, callerId);
  }
}
