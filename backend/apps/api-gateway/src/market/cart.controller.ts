import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  AddCartItemDto,
  CartItemParamDto,
  MARKET_PATTERNS,
  UpdateCartItemDto,
} from 'y/contracts';
import { CurrentUserId } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MarketClient } from './market.client';

/** Todas las rutas exigen login: el carrito pertenece al usuario del token. */
@ApiTags('Cart')
@ApiBearerAuth('JWT-auth')
@ApiResponse({ status: 401, description: 'Token ausente, inválido o vencido' })
@ApiResponse({ status: 503, description: 'La tienda no está disponible' })
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly market: MarketClient) {}

  @Get()
  @ApiOperation({ summary: 'Ver mi carrito' })
  @ApiResponse({ status: 200, description: 'Carrito del usuario' })
  getCart(@CurrentUserId() userId: string) {
    return this.market.send(MARKET_PATTERNS.CART_GET, { userId });
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar un producto (suma si ya estaba)' })
  @ApiResponse({ status: 201, description: 'Producto agregado al carrito' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @ApiResponse({
    status: 409,
    description: 'Stock insuficiente para la cantidad pedida',
  })
  addItem(@CurrentUserId() userId: string, @Body() dto: AddCartItemDto) {
    return this.market.send(MARKET_PATTERNS.CART_ADD_ITEM, { userId, ...dto });
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Cambiar la cantidad de un producto' })
  @ApiResponse({ status: 200, description: 'Cantidad actualizada' })
  @ApiResponse({ status: 400, description: 'ID o cantidad inválidos' })
  @ApiResponse({
    status: 404,
    description: 'El producto no está en el carrito o no existe',
  })
  @ApiResponse({ status: 409, description: 'Stock insuficiente' })
  updateItem(
    @CurrentUserId() userId: string,
    @Param() { productId }: CartItemParamDto,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.market.send(MARKET_PATTERNS.CART_UPDATE_ITEM, {
      userId,
      productId,
      ...dto,
    });
  }

  @Delete('items/:productId')
  @ApiOperation({
    summary: 'Quitar un producto del carrito',
    description:
      'Es idempotente: si el producto no estaba en el carrito, responde 200 con el carrito sin cambios.',
  })
  @ApiResponse({
    status: 200,
    description: 'Carrito actualizado (sin el producto)',
  })
  @ApiResponse({ status: 400, description: 'ID con formato inválido' })
  removeItem(
    @CurrentUserId() userId: string,
    @Param() { productId }: CartItemParamDto,
  ) {
    return this.market.send(MARKET_PATTERNS.CART_REMOVE_ITEM, {
      userId,
      productId,
    });
  }

  @Delete()
  @ApiOperation({ summary: 'Vaciar mi carrito' })
  @ApiResponse({ status: 200, description: 'Carrito vaciado' })
  clear(@CurrentUserId() userId: string) {
    return this.market.send(MARKET_PATTERNS.CART_CLEAR, { userId });
  }
}
