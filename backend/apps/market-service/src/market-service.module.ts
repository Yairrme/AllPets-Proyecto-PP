import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MarketServiceController } from './market-service.controller';
import { MarketServiceService } from './market-service.service';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/allpets'), // Conexión Mongo
    ProductsModule, // <-- REGISTRAR AQUÍ
  ],
  controllers: [MarketServiceController],
  providers: [MarketServiceService],
})
export class MarketServiceModule {}