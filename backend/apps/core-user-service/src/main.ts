import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { CoreUserServiceModule } from './core-user-service.module';

/**
 * Punto de entrada del microservicio `core-user-service`.
 * A diferencia del API Gateway, NO levanta un servidor HTTP público:
 * se instancia como un microservicio puro (`createMicroservice`) que escucha
 * mensajes internos por el protocolo TCP en el puerto 3001.
 */
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreUserServiceModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: parseInt(process.env.PORT_USER_SERVICE_TCP || '3001'),
      },
    },
  );

  // Habilitar validaciones de DTO globales también dentro del microservicio (defensa en profundidad)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.listen();
  console.log(
    `[Core User Service] Listening on TCP port ${process.env.PORT_USER_SERVICE_TCP || '3001'}`,
  );
}
bootstrap();
