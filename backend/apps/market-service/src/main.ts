import { NestFactory } from '@nestjs/core';
import { MarketServiceModule } from './market-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MarketServiceModule);
  app.enableCors(); // <-- Habilita peticiones desde el frontend (puerto 5173)
  await app.listen(3000);
}
bootstrap();
