import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddCartItemPayload,
  CartOwnerPayload,
  MARKET_PATTERNS,
  RemoveCartItemPayload,
  UpdateCartItemPayload,
} from 'y/contracts';
import { HttpToRpcExceptionFilter } from '../rpc/http-to-rpc.filter';
import { CartView } from './cart-view';
import { CartService } from './cart.service';

/**
 * Capa de transporte (TCP). No tiene lógica: toda la regla de negocio vive
 * en CartService. El userId lo pone el gateway desde el JWT.
 */
@Controller()
@UseFilters(HttpToRpcExceptionFilter)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @MessagePattern(MARKET_PATTERNS.CART_GET)
  getCart(@Payload() { userId }: CartOwnerPayload): Promise<CartView> {
    return this.cartService.getCart(userId);
  }

  @MessagePattern(MARKET_PATTERNS.CART_ADD_ITEM)
  addItem(
    @Payload() { userId, productId, quantity }: AddCartItemPayload,
  ): Promise<CartView> {
    return this.cartService.addItem(userId, productId, quantity);
  }

  @MessagePattern(MARKET_PATTERNS.CART_UPDATE_ITEM)
  updateItem(
    @Payload() { userId, productId, quantity }: UpdateCartItemPayload,
  ): Promise<CartView> {
    return this.cartService.updateItem(userId, productId, quantity);
  }

  @MessagePattern(MARKET_PATTERNS.CART_REMOVE_ITEM)
  removeItem(
    @Payload() { userId, productId }: RemoveCartItemPayload,
  ): Promise<CartView> {
    return this.cartService.removeItem(userId, productId);
  }

  @MessagePattern(MARKET_PATTERNS.CART_CLEAR)
  clear(@Payload() { userId }: CartOwnerPayload): Promise<CartView> {
    return this.cartService.clear(userId);
  }
}
