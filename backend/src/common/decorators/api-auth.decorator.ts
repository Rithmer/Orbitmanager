import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';

export function ApiAuth() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Недействительный или отсутствующий токен',
    }),
  );
}
