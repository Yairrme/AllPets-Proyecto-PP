import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { UserRole } from 'y/contracts';
import { UserClient } from '../user.client';
import { UserSessionService } from './user-session.service';

describe('UserSessionService', () => {
  const send = jest.fn();
  let service: UserSessionService;

  beforeEach(() => {
    send.mockReset();
    service = new UserSessionService({ send } as unknown as UserClient);
  });

  it('consulta una sola vez por usuario mientras dura la caché', async () => {
    send.mockResolvedValue({ role: UserRole.CLIENT });
    await service.find('a');
    await service.find('a');
    expect(send).toHaveBeenCalledTimes(1);
  });

  it('una cuenta inexistente (404) devuelve null', async () => {
    send.mockRejectedValue(new HttpException('No existe', 404));
    await expect(service.find('a')).resolves.toBeNull();
  });

  it('si el servicio está caído propaga el 503 en vez de negar la sesión', async () => {
    send.mockRejectedValue(new ServiceUnavailableException());
    await expect(service.find('a')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('forget hace que la próxima petición vuelva a consultar', async () => {
    send.mockResolvedValueOnce({ role: UserRole.CLIENT });
    await service.find('a');
    service.forget('a');
    send.mockRejectedValueOnce(new HttpException('No existe', 404));
    await expect(service.find('a')).resolves.toBeNull();
  });
});
