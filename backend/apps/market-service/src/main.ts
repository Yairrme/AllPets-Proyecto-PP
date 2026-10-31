import { NestFactory } from '@nestjs/core';
import { MarketServiceModule } from './market-service.module';

/**
 * Punto de entrada del microservicio `market-service` (estructura base reservada
 * para futuras funcionalidades de marketplace / contrataciones en All Pets).
 */
async function bootstrap() {
  const app = await NestFactory.create(MarketServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
