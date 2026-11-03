import { Test, TestingModule } from '@nestjs/testing';
import { getConnectionToken } from '@nestjs/mongoose';
import { MarketServiceController } from './market-service.controller';

describe('MarketServiceController', () => {
  let controller: MarketServiceController;
  const connection = { readyState: 1 };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MarketServiceController],
      providers: [{ provide: getConnectionToken(), useValue: connection }],
    }).compile();

    controller = app.get<MarketServiceController>(MarketServiceController);
  });

  it('reports the microservice and database as healthy', () => {
    expect(controller.healthCheck()).toEqual({
      status: 'ok',
      service: 'market-service',
      database: 'connected',
    });
  });

  it('reports degraded when MongoDB is disconnected', () => {
    connection.readyState = 0;
    expect(controller.healthCheck()).toMatchObject({
      status: 'degraded',
      database: 'disconnected',
    });
    connection.readyState = 1;
  });
});
