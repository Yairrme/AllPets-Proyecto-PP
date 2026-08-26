import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Product } from './product.schema';

@Controller('products') // <-- Si dejás esto vacío @Controller(), la ruta será "/" en lugar de "/products"
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAll(): Promise<Product[]> {
    return this.productsService.findAll();
  }

  @Post()
  async create(@Body() body: Partial<Product>): Promise<Product> {
    return this.productsService.create(body);
  }
}