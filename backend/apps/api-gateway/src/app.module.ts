import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import Redis from 'ioredis';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { UserSessionService } from './auth/user-session.service';
import { UserClient } from './user.client';
import { validateGatewayEnvironment } from 'y/common';
import { HealthController } from './health.controller';
import { PublicCaregiversController } from './public-caregivers.controller';
import { AdminCaregiversController } from './admin-caregivers.controller';
import { MARKET_SERVICE } from 'y/contracts';
import { CartController } from './market/cart.controller';
import { MarketClient } from './market/market.client';
import { ProductsController } from './market/products.controller';
import { FailOpenThrottlerStorage } from './throttling/fail-open-throttler.storage';

function connectToRedis(url: string): Redis {
  const logger = new Logger('Redis');
  // Sin cola ni reintentos largos: si Redis no responde, la petición no espera.
  const redis = new Redis(url, {
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
  redis.on('error', (error: Error) => logger.error(error.message));
  return redis;
}

@Module({
  imports: [
    // Variables de entorno para Gateway
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateGatewayEnvironment,
    }),
    JwtModule.register({}),
    // Límite global por IP. Las rutas sensibles (login, registro, subidas)
    // definen límites más estrictos con @Throttle.
    // Con REDIS_URL el conteo es compartido entre instancias del gateway; sin ella
    // queda en memoria, que alcanza solo con una instancia (desarrollo).
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        return {
          throttlers: [{ ttl: 60_000, limit: 120 }],
          storage: redisUrl
            ? new FailOpenThrottlerStorage(
                new ThrottlerStorageRedisService(connectToRedis(redisUrl)),
              )
            : undefined,
        };
      },
    }),

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
      {
        name: MARKET_SERVICE,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.TCP,
          options: {
            host:
              configService.get<string>('MARKET_SERVICE_HOST') || '127.0.0.1',
            port: parseInt(
              configService.get<string>('MARKET_SERVICE_PORT') || '3002',
            ),
          },
        }),
      },
    ]),
  ],
  controllers: [
    AuthController,
    UserController,
    HealthController,
    PublicCaregiversController,
    AdminCaregiversController,
    ProductsController,
    CartController,
  ],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    MarketClient,
    UserClient,
    UserSessionService,
    // Sin este guard global, ThrottlerModule y los @Throttle no limitan nada.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
