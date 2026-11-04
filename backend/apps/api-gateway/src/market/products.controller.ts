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
@ApiResponse({
  status: 503,
  description: 'La tienda (market-service) no está disponible o no respondió',
})
@Controller('products')
export class ProductsController {
  constructor(private readonly market: MarketClient) {}

  @Get()
  @ApiOperation({
    summary: 'Listar el catálogo (público)',
    description: 'No requiere autenticación. No está paginado.',
  })
  @ApiResponse({ status: 200, description: 'Listado de productos' })
  getAll() {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_LIST);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Ver un producto (público)',
    description: 'No requiere autenticación.',
  })
  @ApiResponse({ status: 200, description: 'Producto encontrado' })
  @ApiResponse({ status: 400, description: 'El id no es un ObjectId válido' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  getOne(@Param() { id }: ProductIdParamDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_GET, { id });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear un producto (solo admin)',
    description: 'Requiere token JWT con rol ADMIN.',
  })
  @ApiResponse({ status: 201, description: 'Producto creado' })
  @ApiResponse({
    status: 400,
    description:
      'Datos inválidos: falta un campo obligatorio, un valor viola sus límites o se envió un campo no permitido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token ausente, inválido o vencido',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN' })
  create(@Body() dto: CreateProductDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_CREATE, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Editar un producto (solo admin)',
    description:
      'Requiere token JWT con rol ADMIN. Edición parcial: todos los campos son opcionales.',
  })
  @ApiResponse({ status: 200, description: 'Producto actualizado' })
  @ApiResponse({
    status: 400,
    description:
      'Id inválido, datos inválidos o se envió un campo no permitido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token ausente, inválido o vencido',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  update(@Param() { id }: ProductIdParamDto, @Body() dto: UpdateProductDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_UPDATE, { id, ...dto });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar un producto (solo admin)',
    description: 'Requiere token JWT con rol ADMIN.',
  })
  @ApiResponse({ status: 200, description: 'Producto eliminado' })
  @ApiResponse({ status: 400, description: 'El id no es un ObjectId válido' })
  @ApiResponse({
    status: 401,
    description: 'Token ausente, inválido o vencido',
  })
  @ApiResponse({ status: 403, description: 'Requiere rol ADMIN' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  remove(@Param() { id }: ProductIdParamDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_DELETE, { id });
  }
}
