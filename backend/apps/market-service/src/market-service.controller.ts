import { Controller } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { MessagePattern } from '@nestjs/microservices';
import { Connection } from 'mongoose';
import { MARKET_PATTERNS } from 'y/contracts';

@Controller()
export class MarketServiceController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @MessagePattern(MARKET_PATTERNS.HEALTH_CHECK)
  healthCheck() {
    return {
      status: this.connection.readyState === 1 ? 'ok' : 'degraded',
      service: 'market-service',
      database: this.connection.readyState === 1 ? 'connected' : 'disconnected',
    };
  }
}
