import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, SortOrder } from 'mongoose';
import { escapeRegex } from 'y/common';
import { ProductsQueryDto, UpdateProductDto } from 'y/contracts';
import { Product, ProductDocument } from './product.schema';

export interface ProductFacet {
  value: string;
  count: number;
}

export interface ProductsPage {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Opciones de filtro con su cantidad, según lo ya filtrado. */
  facets: { petTypes: ProductFacet[]; categories: ProductFacet[] };
}

const SORTS: Record<string, Record<string, SortOrder>> = {
  relevancia: { _id: 1 },
  'precio-asc': { price: 1, _id: 1 },
  'precio-desc': { price: -1, _id: 1 },
};

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(query: ProductsQueryDto): Promise<ProductsPage> {
    const { page, limit, q, petType, category, sort = 'relevancia' } = query;

    const searched: QueryFilter<ProductDocument> = q
      ? {
          $or: ['title', 'description', 'category', 'petType'].map((field) => ({
            [field]: { $regex: escapeRegex(q), $options: 'i' },
          })),
        }
      : {};
    const byPet = petType ? { ...searched, petType } : searched;
    const filter = category ? { ...byPet, category } : byPet;

    const [data, total, petTypes, categories] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(SORTS[sort])
        .skip((page - 1) * limit)
        .limit(limit)
        .lean<Product[]>()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
      this.facet(searched, 'petType'),
      this.facet(byPet, 'category'),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      facets: { petTypes, categories },
    };
  }

  private facet(
    filter: QueryFilter<ProductDocument>,
    field: 'petType' | 'category',
  ): Promise<ProductFacet[]> {
    return this.productModel
      .aggregate<ProductFacet>([
        { $match: filter },
        { $group: { _id: `$${field}`, count: { $sum: 1 } } },
        { $project: { _id: 0, value: '$_id', count: 1 } },
        { $sort: { value: 1 } },
      ])
      .exec();
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
