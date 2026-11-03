import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { timingSafeEqual } from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import { consoleLogger } from 'y/common';
import { requestLogging } from './request-logging.middleware';

/** Orígenes permitidos en desarrollo si no se configura CORS_ORIGINS. */
const DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: consoleLogger(),
  });
  const logger = new Logger('ApiGateway');

  // Cierra conexiones y termina las peticiones en curso al detener el contenedor
  app.enableShutdownHooks();
  app.use(requestLogging);

  // Detrás de un proxy, sin esto todas las peticiones parecen venir de la misma IP
  // y comparten el límite. Es la cantidad de proxies propios: nunca confiar de más,
  // porque el cliente podría falsear su IP con X-Forwarded-For.
  const proxyHops = Number(process.env.TRUST_PROXY_HOPS ?? 0);
  if (proxyHops > 0) {
    app.set('trust proxy', proxyHops);
  }

  // cross-origin: el frontend vive en otro origen y muestra las fotos de /uploads
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // CORS: solo el frontend. CORS_ORIGINS es una lista separada por comas.
  app.enableCors({
    origin: process.env.CORS_ORIGINS
      ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
      : DEV_ORIGINS,
    exposedHeaders: ['x-request-id'],
  });

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
  logger.log(`Servidor HTTP corriendo en http://localhost:${port}`);
  logger.log(
    swaggerEnabled
      ? `Documentación Swagger en http://localhost:${port}/api/docs`
      : 'Swagger deshabilitado en producción.',
  );
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
