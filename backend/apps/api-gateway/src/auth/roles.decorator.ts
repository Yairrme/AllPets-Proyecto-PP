import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'y/contracts';

/** Clave de metadatos usada por Reflector para leer los roles requeridos en un endpoint */
export const ROLES_KEY = 'roles';

/**
 * Decorador personalizado `@Roles(...)` para restringir el acceso a rutas según el rol.
 * Ejemplo de uso: `@Roles(UserRole.WALKER, UserRole.CAREGIVER)`
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
