import { Module } from '@nestjs/common';
import { BookingLocationServiceController } from './booking-location-service.controller';
import { BookingLocationServiceService } from './booking-location-service.service';

@Module({
  imports: [],
  controllers: [BookingLocationServiceController],
  providers: [BookingLocationServiceService],
})
export class BookingLocationServiceModule {}
