import { Test, TestingModule } from '@nestjs/testing';
import { MarketServiceController } from './market-service.controller';
import { MarketServiceService } from './market-service.service';

describe('MarketServiceController', () => {
  let marketServiceController: MarketServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MarketServiceController],
      providers: [MarketServiceService],
    }).compile();

    marketServiceController = app.get<MarketServiceController>(MarketServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(marketServiceController.getHello()).toBe('Hello World!');
    });
  });
});
