import { ConflictException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../products/product.schema';
import { CartDocument } from './cart.schema';
import { CartService } from './cart.service';

const userId = '64b7f0c2a1d3e4f5a6b7c8d9';
const productId = new Types.ObjectId().toString();
const product = {
  _id: new Types.ObjectId(productId),
  title: 'Hueso',
  imageUrl: '/uploads/hueso.jpg',
  price: 10,
  stock: 50,
} as unknown as Product;

const exec = <T>(value: T) => ({ exec: () => Promise.resolve(value) });

function setup(carts: unknown[], matched: number[] = []) {
  const cartModel = {
    findOne: jest.fn(() => ({
      lean: () => exec(carts.length > 1 ? carts.shift() : carts[0]),
    })),
    updateOne: jest.fn(() =>
      exec({ matchedCount: matched.length ? matched.shift() : 1 }),
    ),
    create: jest.fn(() => Promise.resolve()),
    deleteOne: jest.fn(() => exec({ deletedCount: 1 })),
  };
  const productModel = {
    findById: jest.fn(() => exec(product)),
    find: jest.fn(() => exec([product])),
  };
  const service = new CartService(
    productModel as unknown as Model<ProductDocument>,
    cartModel as unknown as Model<CartDocument>,
  );
  return { service, cartModel };
}

const item = (quantity: number) => ({
  product_id: new Types.ObjectId(productId),
  quantity,
});

describe('CartService (dos peticiones sobre el mismo carrito)', () => {
  it('si otra petición ganó, vuelve a leer y suma sobre el valor nuevo', async () => {
    const { service, cartModel } = setup(
      [
        { items: [item(1)], __v: 0 },
        { items: [item(3)], __v: 1 },
      ],
      [0, 1],
    );

    const view = await service.addItem(userId, productId, 2);

    expect(cartModel.updateOne).toHaveBeenCalledTimes(2);
    expect(cartModel.updateOne).toHaveBeenLastCalledWith(
      { user_id: userId, __v: 1 },
      expect.objectContaining({ $inc: { __v: 1 } }),
    );
    // 3 (lo que dejó la otra petición) + 2, no 1 + 2
    expect(view.items[0].quantity).toBe(5);
  });

  it('un carrito viejo sin __v se puede actualizar', async () => {
    const { service, cartModel } = setup([{ items: [item(1)] }]);
    await service.updateItem(userId, productId, 4);
    expect(cartModel.updateOne).toHaveBeenCalledWith(
      { user_id: userId, __v: null },
      expect.anything(),
    );
  });

  it('si otra petición crea el carrito primero, reintenta sobre ese', async () => {
    const { service, cartModel } = setup([null, { items: [item(1)], __v: 0 }]);
    cartModel.create.mockRejectedValueOnce({ code: 11000 });

    const view = await service.addItem(userId, productId, 1);

    expect(cartModel.updateOne).toHaveBeenCalledTimes(1);
    expect(view.items[0].quantity).toBe(2);
  });

  it('tras varios intentos fallidos responde 409 y no pierde datos en silencio', async () => {
    const { service } = setup([{ items: [item(1)], __v: 0 }], [0, 0, 0, 0, 0]);
    await expect(service.clear(userId)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('quitar un ítem sin carrito no crea un documento vacío', async () => {
    const { service, cartModel } = setup([null]);
    await service.removeItem(userId, productId);
    expect(cartModel.create).not.toHaveBeenCalled();
  });

  it('deleteCart borra el documento del usuario', async () => {
    const { service, cartModel } = setup([null]);
    await expect(service.deleteCart(userId)).resolves.toEqual({
      deleted: true,
    });
    expect(cartModel.deleteOne).toHaveBeenCalledWith({ user_id: userId });
  });
});
