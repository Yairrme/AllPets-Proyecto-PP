import {
  HttpException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout, TimeoutError } from 'rxjs';
import { MARKET_SERVICE } from 'y/contracts';

const REQUEST_TIMEOUT_MS = 5000;

interface SerializedHttpError {
  status: number;
  body: string | object;
}

function isSerializedHttpError(error: unknown): error is SerializedHttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    Number.isInteger((error as SerializedHttpError).status) &&
    'body' in error
  );
}

/**
 * Envoltorio del cliente TCP hacia el market-service. Traduce los errores
 * del microservicio a respuestas HTTP correctas (404, 409, 400...) en vez de
 * dejar que todo termine como un 500.
 */
@Injectable()
export class MarketClient {
  private readonly logger = new Logger(MarketClient.name);

  constructor(@Inject(MARKET_SERVICE) private readonly client: ClientProxy) {}

  async send<T>(pattern: object, payload: object = {}): Promise<T> {
    try {
      return await firstValueFrom(
        this.client.send<T>(pattern, payload).pipe(timeout(REQUEST_TIMEOUT_MS)),
      );
    } catch (error) {
      throw this.toHttpException(error);
    }
  }

  private toHttpException(error: unknown): HttpException {
    if (isSerializedHttpError(error)) {
      return new HttpException(error.body, error.status);
    }
    // Sin respuesta del servicio (caído, timeout) o error inesperado.
    this.logger.error(
      error instanceof TimeoutError
        ? 'market-service no respondió a tiempo'
        : `Error llamando a market-service: ${JSON.stringify(error)}`,
    );
    return new ServiceUnavailableException(
      'La tienda no está disponible en este momento. Intentá de nuevo en unos minutos.',
    );
  }
}
