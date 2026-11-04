import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { marketEnvironmentSchema } from 'y/common';
import { CartModule } from './cart/cart.module';
import { MarketServiceController } from './market-service.controller';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: marketEnvironmentSchema,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri:
          config.get<string>('MONGO_URI_MARKET') ??
          'mongodb://127.0.0.1:27017/allpets',
      }),
    }),
    ProductsModule,
    CartModule,
  ],
  controllers: [MarketServiceController],
})
export class MarketServiceModule {}
