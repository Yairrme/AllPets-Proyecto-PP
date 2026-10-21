import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';

/**
 * Por TCP no existen los códigos HTTP: una HttpException (404 producto no
 * encontrado, 409 sin stock...) llegaría al gateway como "Internal server
 * error". Este filtro la serializa con su código y su cuerpo, y el gateway la
 * reconstruye tal cual para que el frontend reciba el 409 / 404 / 400 reales.
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
