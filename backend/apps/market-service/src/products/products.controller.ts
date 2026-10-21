import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateProductDto, MARKET_PATTERNS } from 'y/contracts';
import { HttpToRpcExceptionFilter } from '../rpc/http-to-rpc.filter';
import { Product } from './product.schema';
import { ProductsService } from './products.service';

@Controller()
@UseFilters(HttpToRpcExceptionFilter)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_LIST)
  getAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @MessagePattern(MARKET_PATTERNS.PRODUCTS_CREATE)
  create(@Payload() dto: CreateProductDto): Promise<Product> {
    return this.productsService.create(dto);
  }
}
