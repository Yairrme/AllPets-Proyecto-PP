import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserRole } from 'y/contracts';
import { UserClient } from '../user.client';

export interface UserSession {
  role: UserRole;
}

/**
 * Tiempo máximo que tarda en aplicarse en otras instancias del gateway un cambio
 * de rol o una cuenta eliminada. Evita consultar al servicio en cada petición.
 */
const CACHE_TTL_MS = 60_000;
const MAX_CACHED_USERS = 10_000;

/** Comprueba que la cuenta del token siga existiendo y cuál es su rol actual. */
@Injectable()
export class UserSessionService {
  private readonly cache = new Map<
    string,
    { session: UserSession | null; expiresAt: number }
  >();

  constructor(private readonly users: UserClient) {}

  async find(userId: string): Promise<UserSession | null> {
    const cached = this.cache.get(userId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.session;
    }

    const session = await this.fetch(userId);
    if (this.cache.size >= MAX_CACHED_USERS) {
      this.cache.clear();
    }
    this.cache.set(userId, {
      session,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
    return session;
  }

  /** Para que una cuenta eliminada deje de valer en esta instancia al instante. */
  forget(userId: string): void {
    this.cache.delete(userId);
  }

  private async fetch(userId: string): Promise<UserSession | null> {
    try {
      return await this.users.send<UserSession>(
        'get_user_session',
        { user_id: userId },
        'Error al validar la sesión',
      );
    } catch (error) {
      if (
        error instanceof HttpException &&
        error.getStatus() === HttpStatus.NOT_FOUND
      ) {
        return null;
      }
      throw error;
    }
  }
}
