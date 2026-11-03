import {
  ArgumentsHost,
  Catch,
  HttpException,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable, throwError, TimeoutError } from 'rxjs';

/** Forma en que viaja una HttpException por TCP (ver HttpToRpcExceptionFilter). */
export interface SerializedHttpError {
  status: number;
  body: string | object;
}

export function isSerializedHttpError(
  error: unknown,
): error is SerializedHttpError {
  return (
    typeof error === 'object' &&
    error !== null &&
    Number.isInteger((error as SerializedHttpError).status) &&
    'body' in error
  );
}

/**
 * Por TCP no existen los códigos HTTP: una HttpException (404 no encontrado,
 * 409 conflicto, 401 credenciales inválidas...) llegaría al gateway como
 * "Internal server error". Este filtro la serializa con su código y su cuerpo,
 * y el gateway la reconstruye tal cual para que el frontend reciba el código real.
 */
@Catch(HttpException)
export class HttpToRpcExceptionFilter extends BaseRpcExceptionFilter {
  catch(exception: HttpException, _host: ArgumentsHost): Observable<never> {
    return throwError(() => ({
      status: exception.getStatus(),
      body: exception.getResponse(),
    }));
  }
}

/**
 * Traduce el error recibido de un microservicio a una HttpException para el
 * gateway:
 *  - HttpException serializada por HttpToRpcExceptionFilter -> mismo código y cuerpo.
 *  - RpcException({ status, message }) -> ese código y mensaje.
 *  - Error de red o sin respuesta (ECONNREFUSED, ECONNRESET, timeout...) -> 503.
 *    Su mensaje puede incluir IPs internas, por eso nunca se reenvía al cliente.
 *  - Cualquier otro error -> 500 con el mensaje de respaldo.
 */
export function rpcErrorToHttpException(
  error: unknown,
  fallbackMessage: string,
): HttpException {
  if (isSerializedHttpError(error)) {
    return new HttpException(error.body, error.status);
  }

  const { status, message, code } = (error ?? {}) as {
    status?: unknown;
    message?: unknown;
    code?: unknown;
  };

  if (
    error instanceof TimeoutError ||
    error instanceof Error ||
    typeof code === 'string'
  ) {
    return new ServiceUnavailableException(
      'El servicio no está disponible en este momento. Intentá de nuevo en unos minutos.',
    );
  }

  if (Number.isInteger(status)) {
    return new HttpException(
      typeof message === 'string' && message ? message : fallbackMessage,
      status as number,
    );
  }

  // Error no controlado dentro del microservicio ({ status: 'error', ... } de Nest)
  return new InternalServerErrorException(fallbackMessage);
}
