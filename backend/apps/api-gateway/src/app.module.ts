import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth.controller';
import { UserController } from './user.controller';

@Module({
  imports: [
    // Variables de entorno para Gateway
    ConfigModule.forRoot({
      isGlobal: true,
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
            port: parseInt(configService.get<string>('USER_SERVICE_PORT') || '3001'),
          },
        }),
      },
    ]),
  ],
  controllers: [AppController, AuthController, UserController],
  providers: [AppService],
})
export class AppModule {}
