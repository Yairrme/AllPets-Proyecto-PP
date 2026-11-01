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
  CreateProductDto,
  MARKET_PATTERNS,
  ProductIdParamDto,
  UpdateProductDto,
  UserRole,
} from 'y/contracts';
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

  @Get(':id')
  @ApiOperation({ summary: 'Ver un producto (público)' })
  getOne(@Param() { id }: ProductIdParamDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_GET, { id });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear un producto (solo admin)' })
  create(@Body() dto: CreateProductDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_CREATE, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Editar un producto (solo admin)' })
  update(@Param() { id }: ProductIdParamDto, @Body() dto: UpdateProductDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_UPDATE, { id, ...dto });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Eliminar un producto (solo admin)' })
  remove(@Param() { id }: ProductIdParamDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_DELETE, { id });
  }
}
