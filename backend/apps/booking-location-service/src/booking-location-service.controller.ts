import { Controller, Get } from '@nestjs/common';
import { BookingLocationServiceService } from './booking-location-service.service';

@Controller()
export class BookingLocationServiceController {
  constructor(private readonly bookingLocationServiceService: BookingLocationServiceService) {}

  @Get()
  getHello(): string {
    return this.bookingLocationServiceService.getHello();
  }
}
