import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

// Restricciones según "Esquema de Base de Datos: Market Service" (docs/ANCLA.md).
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Product {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, lowercase: true, trim: true })
  petType: string;

  @Prop({ required: true, lowercase: true, trim: true })
  category: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ required: true, default: 0, min: 0 })
  stock: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
// Filtros y orden del catálogo.
ProductSchema.index({ petType: 1, category: 1, _id: 1 });
ProductSchema.index({ category: 1, _id: 1 });
ProductSchema.index({ price: 1, _id: 1 });
