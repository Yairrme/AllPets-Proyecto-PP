import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'y/contracts';
import { ROLES_KEY } from './roles.decorator';
import { AuthenticatedRequest } from './auth.types';

/**
 * Guard de autorización basada en roles (RBAC).
 * Lee los roles declarados con el decorador `@Roles(...)` en el controlador o método
 * y comprueba que `request.user.role` esté incluido en la lista permitida.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Busca metadatos `@Roles()` tanto en el método del endpoint como en la clase del controlador
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si la ruta no especifica `@Roles()`, cualquier usuario autenticado puede continuar
    if (!requiredRoles?.length) {
      return true;
    }

    // Verifica que el usuario autenticado tenga uno de los roles requeridos
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user || !requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta acción.',
      );
    }

    return true;
  }
}
