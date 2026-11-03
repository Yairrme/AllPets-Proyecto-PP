import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { rpcErrorToHttpException } from 'y/common';

// Mayor que en la tienda: el login y el registro calculan bcrypt.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Envoltorio del cliente TCP hacia el core-user-service: ninguna petición queda
 * colgada si el servicio no responde, y los errores llegan con su código HTTP.
 */
@Injectable()
export class UserClient {
  private readonly logger = new Logger(UserClient.name);

  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  async send<T = any>(
    cmd: string,
    payload: unknown,
    fallback: string,
  ): Promise<T> {
    try {
      return await firstValueFrom(
        this.client.send<T>({ cmd }, payload).pipe(timeout(REQUEST_TIMEOUT_MS)),
      );
    } catch (error) {
      throw this.toHttpException(cmd, error, fallback);
    }
  }

  private toHttpException(
    cmd: string,
    error: unknown,
    fallback: string,
  ): HttpException {
    const exception = rpcErrorToHttpException(error, fallback);
    if (exception.getStatus() >= 500) {
      this.logger.error(`${cmd}: ${JSON.stringify(error)}`);
    }
    return exception;
  }
}
