import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { isDuplicateKeyError } from 'y/common';
import { MAX_QUANTITY_PER_ITEM } from 'y/contracts';
import { Product, ProductDocument } from '../products/product.schema';
import { CartView, CartItemView } from './cart-view';
import { Cart, CartDocument, CartItem } from './cart.schema';

/** Reintentos si otra petición modifica el mismo carrito al mismo tiempo. */
const MAX_SAVE_ATTEMPTS = 5;

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Cart.name)
    private readonly cartModel: Model<CartDocument>,
  ) {}

  async getCart(userId: string): Promise<CartView> {
    const cart = await this.loadCart(userId);
    return this.toView(cart?.items ?? []);
  }

  async addItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartView> {
    const product = await this.requireProduct(productId);
    return this.changeItems(userId, (items) => {
      const idx = items.findIndex((i) => i.product_id.toString() === productId);
      const currentQty = idx >= 0 ? items[idx].quantity : 0;
      const nextQty = Math.min(currentQty + quantity, MAX_QUANTITY_PER_ITEM);

      this.assertStock(product, nextQty);

      if (idx >= 0) {
        items[idx] = { ...items[idx], quantity: nextQty };
      } else {
        items.push({
          product_id: new Types.ObjectId(productId),
          quantity: nextQty,
        });
      }
      return items;
    });
  }

  async updateItem(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartView> {
    const product = await this.requireProduct(productId);
    this.assertStock(product, quantity);

    return this.changeItems(userId, (items) => {
      const idx = items.findIndex((i) => i.product_id.toString() === productId);
      if (idx < 0) {
        throw new NotFoundException({ code: 'ITEM_NOT_IN_CART', productId });
      }
      items[idx] = { ...items[idx], quantity };
      return items;
    });
  }

  async removeItem(userId: string, productId: string): Promise<CartView> {
    return this.changeItems(userId, (items) =>
      items.filter((i) => i.product_id.toString() !== productId),
    );
  }

  async clear(userId: string): Promise<CartView> {
    return this.changeItems(userId, () => []);
  }

  /** Borra el documento: se usa cuando se elimina la cuenta del usuario. */
  async deleteCart(userId: string): Promise<{ deleted: boolean }> {
    const result = await this.cartModel.deleteOne({ user_id: userId }).exec();
    return { deleted: result.deletedCount > 0 };
  }

  private loadCart(userId: string) {
    return this.cartModel
      .findOne({ user_id: userId })
      .lean<Cart & { __v?: number }>()
      .exec();
  }

  /**
   * Lee, aplica el cambio y guarda solo si nadie modificó el carrito en el medio
   * (compara __v). Si otra petición ganó, vuelve a leer y a aplicar el cambio.
   */
  private async changeItems(
    userId: string,
    change: (items: CartItem[]) => CartItem[],
  ): Promise<CartView> {
    for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
      const cart = await this.loadCart(userId);
      const items = change([...(cart?.items ?? [])]);
      const saved = cart
        ? await this.updateIfUnchanged(userId, cart.__v, items)
        : await this.createCart(userId, items);
      if (saved) return this.toView(items);
    }
    throw new ConflictException({ code: 'CART_BUSY' });
  }

  private async updateIfUnchanged(
    userId: string,
    version: number | undefined,
    items: CartItem[],
  ): Promise<boolean> {
    const result = await this.cartModel
      .updateOne(
        // Un carrito sin __v (creado por un upsert anterior) coincide con null.
        { user_id: userId, __v: version ?? null },
        { $set: { items }, $inc: { __v: 1 } },
      )
      .exec();
    return result.matchedCount === 1;
  }

  private async createCart(
    userId: string,
    items: CartItem[],
  ): Promise<boolean> {
    if (items.length === 0) return true;
    try {
      await this.cartModel.create({ user_id: userId, items });
      return true;
    } catch (error: unknown) {
      // Otra petición lo creó primero: se reintenta sobre ese carrito.
      if (isDuplicateKeyError(error)) return false;
      throw error;
    }
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
    const stock = product.stock ?? 0;
    if (quantity > stock) {
      throw new ConflictException({
        code: 'INSUFFICIENT_STOCK',
        available: stock,
      });
    }
  }

  private async toView(items: CartItem[]): Promise<CartView> {
    if (items.length === 0) {
      return { items: [], totalItems: 0, total: 0 };
    }

    const ids = items.map((i) => i.product_id);
    const products = await this.productModel.find({ _id: { $in: ids } }).exec();
    const byId = new Map(products.map((p) => [p._id.toString(), p]));

    const viewItems: CartItemView[] = [];
    for (const item of items) {
      // Si el producto se eliminó del catálogo, el ítem deja de mostrarse.
      const p = byId.get(item.product_id.toString());
      if (!p) continue;
      const stock = p.stock ?? 0;
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
