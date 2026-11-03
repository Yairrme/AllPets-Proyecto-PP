import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, JwtUser } from './auth.types';
import { UserSessionService } from './user-session.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly userSessions: UserSessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    const [type, token] = authorization?.split(' ') ?? [];

    if (type !== 'Bearer' || !token) {
      throw new UnauthorizedException('Se requiere un token Bearer válido.');
    }

    let payload: JwtUser;
    try {
      payload = await this.jwtService.verifyAsync<JwtUser>(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('El token es inválido o ha expirado.');
    }

    // Un token firmado no alcanza: la cuenta pudo eliminarse o cambiar de rol.
    const session = await this.userSessions.find(payload.sub);
    if (!session) {
      throw new UnauthorizedException('La cuenta ya no existe.');
    }
    request.user = { ...payload, role: session.role };
    return true;
  }
}
