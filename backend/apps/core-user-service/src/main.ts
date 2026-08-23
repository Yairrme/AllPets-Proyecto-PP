import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { CoreUserServiceModule } from './core-user-service.module';

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

  // Habilitar validaciones de DTO globales
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  await app.listen();
  console.log(`[Core User Service] Listening on TCP port ${process.env.PORT_USER_SERVICE_TCP || '3001'}`);
}
bootstrap();
