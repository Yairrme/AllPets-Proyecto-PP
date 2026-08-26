import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsModule } from './products/products.module'; // <-- Importar aquí

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/allpets'),
    ProductsModule, // <-- Agregar aquí
  ],
})
export class AppModule {}