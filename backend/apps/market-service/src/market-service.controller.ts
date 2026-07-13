import { Controller, Get } from '@nestjs/common';
import { MarketServiceService } from './market-service.service';

@Controller()
export class MarketServiceController {
  constructor(private readonly marketServiceService: MarketServiceService) {}

  @Get()
  getHello(): string {
    return this.marketServiceService.getHello();
  }
}
