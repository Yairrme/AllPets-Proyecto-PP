import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UpdateProductDto } from 'y/contracts';
import { Product, ProductDocument } from './product.schema';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(): Promise<Product[]> {
    return this.productModel.find().exec();
  }

  async findOne(id: string): Promise<Product> {
    return this.requireProduct(id);
  }

  // Nuevo método para crear productos
  async create(productData: Partial<Product>): Promise<Product> {
    const newProduct = new this.productModel(productData);
    return newProduct.save();
  }

  async update(id: string, changes: UpdateProductDto): Promise<Product> {
    const product = await this.requireProduct(id);
    // Solo se aplican los campos realmente enviados (nunca undefined).
    const defined = Object.fromEntries(
      Object.entries(changes).filter(([, value]) => value !== undefined),
    );
    Object.assign(product, defined);
    return product.save();
  }

  async remove(id: string): Promise<Product> {
    const deleted = await this.productModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', productId: id });
    }
    return deleted;
  }

  private async requireProduct(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', productId: id });
    }
    return product;
  }
}
