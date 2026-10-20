import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { validateEnvironment } from 'y/common';
import { HealthController } from './health.controller';
import { PublicCaregiversController } from './public-caregivers.controller';

@Module({
  imports: [
    // Variables de entorno para Gateway
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    JwtModule.register({}),
    // Rate limit GLOBAL por IP (se aplica a todas las rutas vía APP_GUARD).
    // Rutas sensibles (login, registro, uploads) tienen límites más estrictos
    // con @Throttle en su controlador.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),

    // Registro de cliente TCP para comunicarse con core-user-service
    ClientsModule.registerAsync([
      {
        name: 'USER_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host: configService.get<string>('USER_SERVICE_HOST') || '127.0.0.1',
            port: parseInt(
              configService.get<string>('USER_SERVICE_PORT') || '3001',
            ),
          },
        }),
      },
    ]),
  ],
  controllers: [
    AppController,
    AuthController,
    UserController,
    HealthController,
    PublicCaregiversController,
  ],
  providers: [
    AppService,
    JwtAuthGuard,
    RolesGuard,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
