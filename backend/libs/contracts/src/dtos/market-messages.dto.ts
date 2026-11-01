import { IsMongoId } from 'class-validator';
import {
  AddCartItemDto,
  CartItemParamDto,
  UpdateCartItemDto,
} from './cart.dto';
import { UpdateProductDto } from './product.dto';

// Payloads que viajan por TCP del gateway al market-service.
// userId siempre sale del JWT validado en el gateway, nunca del body del cliente.
export class CartOwnerPayload {
  @IsMongoId()
  userId: string;
}

export class AddCartItemPayload extends AddCartItemDto {
  @IsMongoId()
  userId: string;
}

export class UpdateCartItemPayload extends UpdateCartItemDto {
  @IsMongoId()
  userId: string;

  @IsMongoId()
  productId: string;
}

export class RemoveCartItemPayload extends CartItemParamDto {
  @IsMongoId()
  userId: string;
}

/** Edición de producto: `id` de la ruta + campos a modificar (todos opcionales). */
export class UpdateProductPayload extends UpdateProductDto {
  @IsMongoId()
  id: string;
}
