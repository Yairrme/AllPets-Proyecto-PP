import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  CreateProductDto,
  MARKET_PATTERNS,
  ProductIdParamDto,
  ProductsQueryDto,
  UpdateProductDto,
  UserRole,
} from 'y/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { imageUploadOptions } from '../uploads/upload-options';
import { MarketClient } from './market.client';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly market: MarketClient) {}

  @Get()
  @ApiOperation({
    summary: 'Listar el catálogo con filtros (público, paginado)',
  })
  getAll(@Query() query: ProductsQueryDto) {
    return this.market.send(MARKET_PATTERNS.PRODUCTS_LIST, query);
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

  /**
   * Sube una foto desde la computadora del admin y devuelve su ruta
   * (/uploads/...) para usarla como `imageUrl` al crear o editar un producto.
   * Los guards corren antes que Multer: sin rol admin no se guarda nada en disco.
   */
  @Post('image')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Subir la foto de un producto (solo admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Imagen JPG, PNG o WEBP (máx. 5 MB)',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', imageUploadOptions))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No se ha subido ningún archivo');
    return { imageUrl: `/uploads/${file.filename}` };
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
