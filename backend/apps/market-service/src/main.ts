import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { MarketServiceModule } from './market-service.module';

async function bootstrap() {
  const port = parseInt(process.env.PORT_MARKET_SERVICE_TCP || '3002', 10);

  // Igual que core-user-service: microservicio TCP, no expone HTTP.
  // El único punto de entrada para el frontend es el API Gateway.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MarketServiceModule,
    { transport: Transport.TCP, options: { host: '0.0.0.0', port } },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que el DTO no declara
      forbidNonWhitelisted: true, // y responde 400 en vez de ignorarlos en silencio
      transform: true,
    }),
  );

  await app.listen();
  console.log(`[Market Service] Listening on TCP port ${port}`);
}
bootstrap();
