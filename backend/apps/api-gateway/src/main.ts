import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

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
  // - Desarrollo: siempre disponible en /api/docs.
  // - Producción: DESHABILITADO por defecto. Se puede activar con
  //   SWAGGER_ENABLED=true, y en ese caso exige SWAGGER_USER/SWAGGER_PASSWORD
  //   (autenticación básica) para no exponer el mapa completo de la API.
  const isProduction = process.env.NODE_ENV === 'production';
  const swaggerEnabled =
    !isProduction || process.env.SWAGGER_ENABLED === 'true';

  if (swaggerEnabled) {
    if (isProduction) {
      const swaggerUser = process.env.SWAGGER_USER;
      const swaggerPassword = process.env.SWAGGER_PASSWORD;
      if (!swaggerUser || !swaggerPassword) {
        throw new Error(
          'SWAGGER_ENABLED=true en producción requiere SWAGGER_USER y SWAGGER_PASSWORD.',
        );
      }
      app.use(
        ['/api/docs', '/api/docs-json'],
        swaggerBasicAuth(swaggerUser, swaggerPassword),
      );
    }
    setupSwagger(app);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(
    `[API Gateway] Servidor HTTP corriendo en http://localhost:${port}`,
  );
  if (swaggerEnabled) {
    console.log(
      `[Swagger Docs] Documentación lista en: http://localhost:${port}/api/docs`,
    );
  } else {
    console.log('[Swagger Docs] Deshabilitado en producción.');
  }
}

function setupSwagger(app: NestExpressApplication) {
  const config = new DocumentBuilder()
    .setTitle('All Pets API Gateway')
    .setDescription(
      'Documentación interactiva de la API y Microservicios de All Pets (Autenticación, Usuarios, Cuidadores, Reseñas).',
    )
    .setVersion('1.0.0')
    .addTag('Auth', 'Registro, login y autenticación')
    .addTag(
      'Caregivers (Público)',
      'Búsqueda y consulta de cuidadores y paseadores',
    )
    .addTag('Users', 'Gestión de usuarios y perfiles')
    .addTag(
      'Caregiver Profile',
      'Gestión de perfil profesional, tarifas y fotos',
    )
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
}

/** Middleware de autenticación básica (HTTP Basic) para proteger Swagger. */
function swaggerBasicAuth(user: string, password: string) {
  const expected = Buffer.from(`${user}:${password}`);
  return (req: Request, res: Response, next: NextFunction) => {
    const [scheme, encoded] = (req.headers.authorization ?? '').split(' ');
    const received = Buffer.from(
      scheme === 'Basic' && encoded
        ? Buffer.from(encoded, 'base64').toString()
        : '',
    );
    const valid =
      received.length === expected.length &&
      timingSafeEqual(received, expected);

    if (!valid) {
      res.setHeader('WWW-Authenticate', 'Basic realm="All Pets API Docs"');
      res.status(401).send('Autenticación requerida');
      return;
    }
    next();
  };
}

bootstrap();
