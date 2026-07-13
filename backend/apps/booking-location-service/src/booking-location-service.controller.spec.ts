import { Test, TestingModule } from '@nestjs/testing';
import { BookingLocationServiceController } from './booking-location-service.controller';
import { BookingLocationServiceService } from './booking-location-service.service';

describe('BookingLocationServiceController', () => {
  let bookingLocationServiceController: BookingLocationServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [BookingLocationServiceController],
      providers: [BookingLocationServiceService],
    }).compile();

    bookingLocationServiceController = app.get<BookingLocationServiceController>(BookingLocationServiceController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(bookingLocationServiceController.getHello()).toBe('Hello World!');
    });
  });
});
