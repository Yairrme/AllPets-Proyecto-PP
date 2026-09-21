import { Test, TestingModule } from '@nestjs/testing';
import { CoreUserServiceController } from './core-user-service.controller';
import { CoreUserService } from './core-user-service.service';
import { getConnectionToken } from '@nestjs/mongoose';

describe('CoreUserServiceController', () => {
  let controller: CoreUserServiceController;
  const coreUserService = {};
  const connection = { readyState: 1 };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoreUserServiceController],
      providers: [
        {
          provide: CoreUserService,
          useValue: coreUserService,
        },
        {
          provide: getConnectionToken(),
          useValue: connection,
        },
      ],
    }).compile();

    controller = app.get<CoreUserServiceController>(CoreUserServiceController);
  });

  it('reports the microservice and database as healthy', () => {
    expect(controller.healthCheck()).toEqual({
      status: 'ok',
      service: 'core-user-service',
      database: 'connected',
    });
  });
});
