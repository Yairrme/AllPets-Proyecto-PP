import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { MAX_QUANTITY_PER_ITEM } from 'y/contracts';
import { Product, ProductDocument } from '../products/product.schema';
import { CartView, CartItemView } from './cart-view';

interface CartItemDoc {
  productId: Types.ObjectId;
  quantity: number;
}

interface CartDoc {
  userId: string;
  items: CartItemDoc[];
}

@Injectable()
export class CartService {
  /** Carrito en memoria por userId (suficiente para demo; no se pierde al reiniciar solo si usás Mongo abajo). */
  private readonly carts = new Map<string, CartItemDoc[]>();

  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  async getCart(userId: string): Promise<CartView> {
    const items = this.carts.get(userId) ?? [];
    return this.toView(items);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartView> {
    const product = await this.requireProduct(productId);
    const items = [...(this.carts.get(userId) ?? [])];
    const idx = items.findIndex((i) => i.productId.toString() === productId);
    const currentQty = idx >= 0 ? items[idx].quantity : 0;
    const nextQty = Math.min(currentQty + quantity, MAX_QUANTITY_PER_ITEM);

    this.assertStock(product, nextQty);

    if (idx >= 0) {
      items[idx] = { ...items[idx], quantity: nextQty };
    } else {
      items.push({
        productId: new Types.ObjectId(productId),
        quantity: nextQty,
      });
    }
    this.carts.set(userId, items);
    return this.toView(items);
  }

  async updateItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartView> {
    const product = await this.requireProduct(productId);
    this.assertStock(product, quantity);

    const items = [...(this.carts.get(userId) ?? [])];
    const idx = items.findIndex((i) => i.productId.toString() === productId);
    if (idx < 0) {
      throw new NotFoundException({ code: 'ITEM_NOT_IN_CART', productId });
    }
    items[idx] = { ...items[idx], quantity };
    this.carts.set(userId, items);
    return this.toView(items);
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    const items = (this.carts.get(userId) ?? []).filter(
      (i) => i.productId.toString() !== productId,
    );
    this.carts.set(userId, items);
    return this.toView(items);
  }

  async clear(userId: string): Promise<CartView> {
    this.carts.set(userId, []);
    return this.toView([]);
  }

  private async requireProduct(productId: string): Promise<ProductDocument> {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', productId });
    }
    const product = await this.productModel.findById(productId).exec();
    if (!product) {
      throw new NotFoundException({ code: 'PRODUCT_NOT_FOUND', productId });
    }
    return product;
  }

  private assertStock(product: ProductDocument, quantity: number) {
    const stock = (product as ProductDocument & { stock?: number }).stock ?? 0;
    if (quantity > stock) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        available: stock,
      });
    }
  }

  private async toView(items: CartItemDoc[]): Promise<CartView> {
    if (items.length === 0) {
      return { items: [], totalItems: 0, total: 0 };
    }

    const ids = items.map((i) => i.productId);
    const products = await this.productModel.find({ _id: { $in: ids } }).exec();
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const viewItems: CartItemView[] = [];
    for (const item of items) {
      const p = byId.get(item.productId.toString());
      if (!p) continue;
      const stock = (p as ProductDocument & { stock?: number }).stock ?? 0;
      const price = p.price;
      viewItems.push({
        productId: p._id.toString(),
        title: p.title,
        imageUrl: p.imageUrl,
        price,
        quantity: item.quantity,
        subtotal: price * item.quantity,
        stock,
        hasStock: stock >= item.quantity,
      });
    }

    const totalItems = viewItems.reduce((acc, i) => acc + i.quantity, 0);
    const total = viewItems.reduce((acc, i) => acc + i.subtotal, 0);
    return { items: viewItems, totalItems, total };
  }
}
