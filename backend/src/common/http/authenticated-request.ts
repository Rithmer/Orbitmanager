import { Request } from 'express';
import { AuthenticatedUser } from '@/common/auth/authenticated-user.interface';

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function getAuthenticatedUser(
  request: Request | AuthenticatedRequest,
): AuthenticatedUser | undefined {
  return (request as AuthenticatedRequest).user;
}

export function getRouteParamAsNumber(
  request: Request,
  ...paramNames: string[]
): number | null {
  for (const paramName of paramNames) {
    const rawValue = request.params?.[paramName];
    if (rawValue === undefined) {
      continue;
    }

    const parsedValue = Number(rawValue);
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
  }

  return null;
}
