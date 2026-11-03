import { ServiceUnavailableException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError } from 'rxjs';
import { HealthController } from './health.controller';

const client = (response: () => ReturnType<ClientProxy['send']>) =>
  ({ send: response }) as unknown as ClientProxy;
const ok = client(() => of({ status: 'ok' }));

describe('HealthController', () => {
  it('responde ok si todos los servicios tienen su base de datos', async () => {
    await expect(new HealthController(ok, ok).check()).resolves.toMatchObject({
      status: 'ok',
    });
  });

  it('responde 503 si un servicio perdió la base de datos ("degraded")', async () => {
    const degraded = client(() => of({ status: 'degraded' }));
    await expect(
      new HealthController(degraded, ok).check(),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('responde 503 si un servicio no contesta', async () => {
    const down = client(() => throwError(() => new Error('caído')));
    await expect(new HealthController(ok, down).check()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
