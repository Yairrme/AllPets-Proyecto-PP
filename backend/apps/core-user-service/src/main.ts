import { NestFactory } from '@nestjs/core';
import { CoreUserServiceModule } from './core-user-service.module';

async function bootstrap() {
  const app = await NestFactory.create(CoreUserServiceModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
