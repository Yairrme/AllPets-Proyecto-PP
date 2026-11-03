import {
  ArgumentsHost,
  ConflictException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { firstValueFrom, TimeoutError } from 'rxjs';
import {
  HttpToRpcExceptionFilter,
  rpcErrorToHttpException,
} from './rpc-errors';

describe('rpc-errors', () => {
  const serialize = (exception: Error) =>
    firstValueFrom(
      new HttpToRpcExceptionFilter().catch(
        exception as never,
        {} as ArgumentsHost,
      ),
    ).catch((error: unknown) => error);

  it('una HttpException del microservicio llega al gateway con su código y mensaje', async () => {
    const serialized = await serialize(
      new UnauthorizedException('Credenciales inválidas.'),
    );
    const http = rpcErrorToHttpException(serialized, 'fallback');

    expect(http.getStatus()).toBe(HttpStatus.UNAUTHORIZED);
    expect(http.getResponse()).toMatchObject({
      message: 'Credenciales inválidas.',
    });
  });

  it('conserva cuerpos con detalle (409 con código de negocio)', async () => {
    const serialized = await serialize(
      new ConflictException({ code: 'INSUFFICIENT_STOCK', available: 3 }),
    );
    const http = rpcErrorToHttpException(serialized, 'fallback');

    expect(http.getStatus()).toBe(HttpStatus.CONFLICT);
    expect(http.getResponse()).toEqual({
      code: 'INSUFFICIENT_STOCK',
      available: 3,
    });
  });

  it('RpcException({ status, message }) respeta ese código', () => {
    const http = rpcErrorToHttpException(
      { status: 404, message: 'Paseador o cuidador no encontrado' },
      'fallback',
    );
    expect(http.getStatus()).toBe(HttpStatus.NOT_FOUND);
    expect(http.message).toBe('Paseador o cuidador no encontrado');
  });

  it('servicio caído o timeout -> 503', () => {
    expect(
      rpcErrorToHttpException({ code: 'ECONNREFUSED' }, 'x').getStatus(),
    ).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(rpcErrorToHttpException(new TimeoutError(), 'x').getStatus()).toBe(
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  });

  it('cualquier error de red -> 503, sin reenviar su mensaje interno', () => {
    const http = rpcErrorToHttpException(
      {
        code: 'EHOSTUNREACH',
        message: 'connect EHOSTUNREACH 10.0.0.5:3001',
      },
      'fallback',
    );
    expect(http.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
    expect(http.message).not.toContain('10.0.0.5');
  });

  it('un error desconocido -> 500, sin reenviar su mensaje', () => {
    const http = rpcErrorToHttpException({ message: 'detalle interno' }, 'x');
    expect(http.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(http.message).toBe('x');
  });

  it('error no controlado del microservicio -> 500 con el mensaje de respaldo', () => {
    const http = rpcErrorToHttpException(
      { status: 'error', message: 'Internal server error' },
      'Error al registrar el usuario',
    );
    expect(http.getStatus()).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(http.message).toBe('Error al registrar el usuario');
  });
});
