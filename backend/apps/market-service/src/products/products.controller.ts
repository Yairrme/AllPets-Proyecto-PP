import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateProductDto,
  MARKET_PATTERNS,
  ProductIdParamDto,
  ProductsQueryDto,
  UpdateProductPayload,
} from 'y/contracts';
import { HttpToRpcExceptionFilter } from 'y/common';
import { Product } from './product.schema';
import { ProductsPage, ProductsService } from './products.service';

@Controller()
@UseFilters(HttpToRpcExceptionFilter)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_LIST)
  getAll(@Payload() query: ProductsQueryDto): Promise<ProductsPage> {
    return this.productsService.findAll(query);
  }

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_GET)
  getOne(@Payload() { id }: ProductIdParamDto): Promise<Product> {
    return this.productsService.findOne(id);
  }

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_CREATE)
  create(@Payload() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_UPDATE)
  update(
    @Payload() { id, ...changes }: UpdateProductPayload,
  ): Promise<Product> {
    return this.productsService.update(id, changes);
  }

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_DELETE)
  remove(@Payload() { id }: ProductIdParamDto): Promise<Product> {
    return this.productsService.remove(id);
  }
}
