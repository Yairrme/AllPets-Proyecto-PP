import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS para que el frontend de Vue.js pueda comunicarse con la API
  app.enableCors();

  // Habilitar la validación global de DTOs en las peticiones HTTP entrantes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[API Gateway] Running HTTP Server on port ${port}`);
}
bootstrap();
