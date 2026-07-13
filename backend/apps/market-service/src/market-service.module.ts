import { Module } from '@nestjs/common';
import { MarketServiceController } from './market-service.controller';
import { MarketServiceService } from './market-service.service';

@Module({
  imports: [],
  controllers: [MarketServiceController],
  providers: [MarketServiceService],
})
export class MarketServiceModule {}
