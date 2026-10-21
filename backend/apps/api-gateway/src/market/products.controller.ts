import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateProductDto, MARKET_PATTERNS, UserRole } from 'y/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MarketClient } from './market.client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly market: MarketClient) {}

  @Get()
  @ApiOperation({ summary: 'Listar el catálogo (público)' })
  getAll() {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_LIST);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear un producto (solo admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_CREATE, dto);
  }
}
