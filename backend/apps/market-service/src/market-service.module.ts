import { Module } from '@nestjs/common';
import { MarketServiceController } from './market-service.controller';
import { MarketServiceService } from './market-service.service';

/**
 * Módulo raíz de `market-service` (preparado para futura expansión del monorepo).
 */
@Module({
  imports: [],
  controllers: [MarketServiceController],
  providers: [MarketServiceService],
})
export class MarketServiceModule {}
