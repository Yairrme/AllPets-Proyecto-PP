import { NestFactory } from '@nestjs/core';
import { BookingLocationServiceModule } from './booking-location-service.module';

async function bootstrap() {
  const app = await NestFactory.create(BookingLocationServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
