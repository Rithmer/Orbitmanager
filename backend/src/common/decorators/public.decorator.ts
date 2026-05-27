import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Пропускает глобальный JwtAuthGuard (логин, регистрация, refresh и т.п.). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
