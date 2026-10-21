import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest } from './auth.types';

/**
 * Devuelve el id del usuario autenticado (claim `sub` del JWT que ya validó
 * JwtAuthGuard). El cliente no puede falsearlo: sale del token firmado,
 * nunca del body, la URL ni un header.
 */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().user.sub,
);
