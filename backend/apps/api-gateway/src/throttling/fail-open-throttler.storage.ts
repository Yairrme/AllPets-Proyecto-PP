import { Logger } from '@nestjs/common';
import { ThrottlerStorage } from '@nestjs/throttler';
import { ThrottlerStorageRecord } from '@nestjs/throttler/dist/throttler-storage-record.interface';

/**
 * Si el almacén de límites (Redis) falla, deja pasar la petición y lo registra:
 * una caída de Redis no debe dejar sin servicio a toda la API.
 */
export class FailOpenThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(FailOpenThrottlerStorage.name);

  constructor(private readonly storage: ThrottlerStorage) {}

  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    try {
      return await this.storage.increment(
        key,
        ttl,
        limit,
        blockDuration,
        throttlerName,
      );
    } catch (error) {
      this.logger.error(`Sin límite de peticiones: ${String(error)}`);
      return {
        totalHits: 0,
        timeToExpire: 0,
        isBlocked: false,
        timeToBlockExpire: 0,
      };
    }
  }
}
