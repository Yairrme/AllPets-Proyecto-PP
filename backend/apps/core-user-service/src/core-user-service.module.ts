import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CoreUserServiceController } from './core-user-service.controller';
import { CoreUserService } from './core-user-service.service';
import { User, UserSchema } from './schemas/user.schema';
import { CaregiverProfile, CaregiverProfileSchema } from './schemas/caregiver-profile.schema';
import { Review, ReviewSchema } from './schemas/review.schema';

@Module({
  imports: [
    // Soporte para variables de entorno (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Conexión principal a la base de datos MongoDB
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI_USERS') || 'mongodb://localhost:27017/allpets_users',
      }),
    }),

    // Registro de esquemas
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: CaregiverProfile.name, schema: CaregiverProfileSchema },
      { name: Review.name, schema: ReviewSchema },
    ]),

    // Configuración del módulo JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'defaultsecretkey',
        signOptions: {
          expiresIn: (configService.get<string>('JWT_EXPIRATION') || '7d') as any,
        },
      }),
    }),
  ],
  controllers: [CoreUserServiceController],
  providers: [CoreUserService],
  exports: [CoreUserService],
})
export class CoreUserServiceModule {}