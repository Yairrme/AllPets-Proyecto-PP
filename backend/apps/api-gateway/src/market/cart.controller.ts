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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly market: MarketClient) {}

  @Get()
  @ApiOperation({ summary: 'Ver mi carrito' })
  getCart(@CurrentUserId() userId: string) {
    return this.market.send(MARKET_PATTERNS.CART_GET, { userId });
  }

  @Post('items')
  @ApiOperation({ summary: 'Agregar un producto (suma si ya estaba)' })
  addItem(@CurrentUserId() userId: string, @Body() dto: AddCartItemDto) {
    return this.market.send(MARKET_PATTERNS.CART_ADD_ITEM, { userId, ...dto });
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Cambiar la cantidad de un producto' })
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
  @ApiOperation({ summary: 'Quitar un producto del carrito' })
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
  clear(@CurrentUserId() userId: string) {
    return this.market.send(MARKET_PATTERNS.CART_CLEAR, { userId });
  }
}
