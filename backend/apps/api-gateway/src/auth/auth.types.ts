import { Request } from 'express';
import { UserRole } from 'y/contracts';

/**
 * Payload decodificado del token JWT que identifica al usuario autenticado.
 * - `sub`: ID del documento User en MongoDB
 * - `email`: Correo electrónico del usuario
 * - `role`: Rol dentro del sistema (client, walker, caregiver, admin)
 */
export interface JwtUser {
  sub: string;
  email: string;
  role: UserRole;
}

/** Extiende el objeto Request de Express agregando la propiedad `user` inyectada por JwtAuthGuard */
export type AuthenticatedRequest = Request & {
  user: JwtUser;
};
