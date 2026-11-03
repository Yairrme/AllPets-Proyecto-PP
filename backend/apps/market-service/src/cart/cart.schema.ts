import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/** CART_ITEM del modelo de datos: se guarda embebido dentro del carrito. */
@Schema({ _id: false })
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  product_id: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

export type CartDocument = Cart & Document;

/**
 * CART del modelo de datos (Market DB). Un carrito por usuario.
 * `user_id` es una soft reference al User del core-user-service: viene del JWT
 * validado en el gateway, no se consulta la Users DB desde acá.
 */
@Schema({
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Cart {
  @Prop({ required: true, unique: true, index: true })
  user_id: string;

  @Prop({ type: [CartItemSchema], default: [] })
  items: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
