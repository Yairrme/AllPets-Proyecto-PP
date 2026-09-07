import { Test, TestingModule } from '@nestjs/testing';
import { CoreUserServiceController } from './core-user-service.controller';
import { CoreUserServiceService } from './core-user-service.service';

describe('CoreUserServiceController', () => {
  let coreUserServiceController: CoreUserServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [CoreUserServiceController],
      providers: [CoreUserServiceService],
    }).compile();

    coreUserServiceController = app.get<CoreUserServiceController>(CoreUserServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(coreUserServiceController.getHello()).toBe('Hello World!');
    });
  });
});
  |