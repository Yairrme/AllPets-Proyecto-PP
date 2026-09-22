import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS para comunicación con el frontend
  app.enableCors();

  // Servir archivos estáticos subidos (uploads)
  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  // Validación de DTOs entrantes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ==========================================
  // CONFIGURACIÓN DE SWAGGER (OPENAPI)
  // ==========================================
  const config = new DocumentBuilder()
    .setTitle('All Pets API Gateway')
    .setDescription(
      'Documentación interactiva de la API y Microservicios de All Pets (Autenticación, Usuarios, Cuidadores, Reseñas).',
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Registro, login y autenticación')
    .addTag('Caregivers (Público)', 'Búsqueda y consulta de cuidadores y paseadores')
    .addTag('Users', 'Gestión de usuarios y perfiles')
    .addTag('Caregiver Profile', 'Gestión de perfil profesional, tarifas y fotos')
    .addTag('Reviews', 'Calificaciones y comentarios a cuidadores')
    .addTag('Health', 'Estado de salud del Gateway y Microservicios')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Pega tu token JWT aquí (sin la palabra Bearer)',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantiene la sesión/token si recargas la página
    },
    customSiteTitle: 'All Pets - Swagger API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`[API Gateway] Servidor HTTP corriendo en http://localhost:${port}`);
  console.log(`[Swagger Docs] Documentación lista en: http://localhost:${port}/api/docs`);
}
bootstrap();