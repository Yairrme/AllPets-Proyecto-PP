import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, JwtUser } from './auth.types';

/**
 * Guard de autenticación JWT en el API Gateway.
 * Extrae el token del header `Authorization: Bearer <token>`, verifica su firma
 * y vigencia usando `JWT_SECRET`, e inyecta los datos del usuario en `request.user`.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Obtiene el objeto Request HTTP de Express tipado con `AuthenticatedRequest`
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    // Separa el esquema ("Bearer") del token JWT
    const [type, token] = authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Se requiere un token Bearer válido.');
    }

    try {
      // Verifica criptográficamente el token y su fecha de expiración
      const payload = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
      // Adjunta el payload decodificado (`sub`, `email`, `role`) al request
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('El token es inválido o ha expirado.');
    }
  }
}
