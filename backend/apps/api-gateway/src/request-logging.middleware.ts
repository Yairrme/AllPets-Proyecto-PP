import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('HTTP');
const SAFE_REQUEST_ID = /^[\w-]{1,64}$/;

/**
 * Identifica cada petición (respeta el x-request-id de un proxy si es válido) y
 * registra el resultado. Nunca registra headers ni bodies: llevan tokens y contraseñas.
 */
export function requestLogging(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const received = req.headers['x-request-id'];
  const requestId =
    typeof received === 'string' && SAFE_REQUEST_ID.test(received)
      ? received
      : randomUUID();
  res.setHeader('x-request-id', requestId);

  const start = Date.now();
  res.on('finish', () => {
    // Sin el query string: puede traer texto de búsqueda del usuario.
    const path = req.originalUrl.split('?')[0];
    const line = `${req.method} ${path} ${res.statusCode} ${Date.now() - start}ms [${requestId}]`;
    if (res.statusCode >= 500) logger.error(line);
    else logger.log(line);
  });
  next();
}
