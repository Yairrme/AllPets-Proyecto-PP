import { ThrottlerStorage } from '@nestjs/throttler';
import { FailOpenThrottlerStorage } from './fail-open-throttler.storage';

describe('FailOpenThrottlerStorage', () => {
  it('delega en el almacén real', async () => {
    const record = {
      totalHits: 3,
      timeToExpire: 10,
      isBlocked: false,
      timeToBlockExpire: 0,
    };
    const storage = { increment: jest.fn().mockResolvedValue(record) };
    await expect(
      new FailOpenThrottlerStorage(storage).increment('k', 1, 5, 0, 'default'),
    ).resolves.toBe(record);
  });

  it('si Redis falla deja pasar la petición en vez de responder 500', async () => {
    const storage: ThrottlerStorage = {
      increment: () => Promise.reject(new Error('redis caído')),
    };
    await expect(
      new FailOpenThrottlerStorage(storage).increment('k', 1, 5, 0, 'default'),
    ).resolves.toMatchObject({ isBlocked: false, totalHits: 0 });
  });
});
