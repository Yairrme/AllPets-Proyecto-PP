import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from 'y/contracts';
import { AuthenticatedRequest } from './auth.types';

/**
 * Permite el acceso solo si el usuario autenticado es el dueño del recurso
 * (parámetro de ruta `:userId` o `:id`) o es ADMIN.
 *
 * Al ser un Guard se ejecuta ANTES que los interceptores (Multer), por lo que
 * evita que se guarden archivos en disco cuando la petición no está autorizada.
 * Debe usarse después de JwtAuthGuard.
 */
@Injectable()
export class OwnerOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const targetUserId = request.params?.userId ?? request.params?.id;

    if (!request.user) {
      throw new ForbiddenException('No autenticado.');
    }

    if (
      request.user.role !== UserRole.ADMIN &&
      request.user.sub !== targetUserId
    ) {
      throw new ForbiddenException('Solo puedes acceder a tu propio perfil.');
    }

    return true;
  }
}
