import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { consoleLogger } from 'y/common';
import { MarketServiceModule } from './market-service.module';

async function bootstrap() {
  const port = parseInt(process.env.PORT_MARKET_SERVICE_TCP || '3002', 10);

  // Igual que core-user-service: microservicio TCP, no expone HTTP.
  // El único punto de entrada para el frontend es el API Gateway.
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    MarketServiceModule,
    {
      transport: Transport.TCP,
      // Solo accesible desde esta máquina salvo que se configure otra interfaz
      // (ej. 0.0.0.0 en una red privada de Docker): TCP no tiene autenticación.
      options: {
        host: process.env.MARKET_SERVICE_BIND_HOST || '127.0.0.1',
        port,
      },
      logger: consoleLogger(),
    },
  );

  // Cierra conexiones y termina las peticiones en curso al detener el contenedor
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que el DTO no declara
      forbidNonWhitelisted: true, // y responde 400 en vez de ignorarlos en silencio
      transform: true,
    }),
  );

  await app.listen();
  new Logger('MarketService').log(`Listening on TCP port ${port}`);
}
bootstrap();
