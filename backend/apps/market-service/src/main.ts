import { NestFactory } from '@nestjs/core';
import { MarketServiceModule } from './market-service.module';

async function bootstrap() {
  const app = await NestFactory.create(MarketServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
