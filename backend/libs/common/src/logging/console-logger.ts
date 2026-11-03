import { ConsoleLogger } from '@nestjs/common';

/** En producción una línea JSON por evento, para que la indexe el sistema de logs. */
export function consoleLogger(): ConsoleLogger {
  return new ConsoleLogger({ json: process.env.NODE_ENV === 'production' });
}
