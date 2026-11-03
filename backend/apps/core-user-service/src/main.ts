import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger, ValidationPipe } from '@nestjs/common';
import { consoleLogger, HttpToRpcExceptionFilter } from 'y/common';
import { CoreUserServiceModule } from './core-user-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreUserServiceModule,
    {
      transport: Transport.TCP,
      options: {
        // Solo accesible desde esta máquina salvo que se configure otra interfaz
        // (ej. 0.0.0.0 en una red privada de Docker): TCP no tiene autenticación.
        host: process.env.USER_SERVICE_BIND_HOST || '127.0.0.1',
        port: parseInt(process.env.PORT_USER_SERVICE_TCP || '3001'),
      },
      logger: consoleLogger(),
    },
  );

  // Cierra conexiones y termina las peticiones en curso al detener el contenedor
  app.enableShutdownHooks();

  // Habilitar validaciones de DTO globales
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Envía al gateway el código real (404, 409, 401...) en vez de "Internal server error"
  app.useGlobalFilters(new HttpToRpcExceptionFilter());

  await app.listen();
  new Logger('CoreUserService').log(
    `Listening on TCP port ${process.env.PORT_USER_SERVICE_TCP || '3001'}`,
  );
}
bootstrap();
