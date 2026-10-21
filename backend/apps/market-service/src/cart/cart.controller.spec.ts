import {
  ConflictException,
  INestMicroservice,
  ValidationPipe,
} from '@nestjs/common';
import {
  ClientProxy,
  ClientProxyFactory,
  Transport,
} from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { createServer } from 'net';
import { firstValueFrom } from 'rxjs';
import { MARKET_PATTERNS } from 'y/contracts';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';

const userId = '64b7f0c2a1d3e4f5a6b7c8d9';
const productId = '64b7f0c2a1d3e4f5a6b7c8da';
const emptyCart = { items: [], totalItems: 0, total: 0 };

function freePort(): Promise<number> {
  return new Promise((resolve) => {
    const server = createServer().listen(0, '127.0.0.1', () => {
      const { port } = server.address() as { port: number };
      server.close(() => resolve(port));
    });
  });
}

describe('CartController (capa TCP)', () => {
  let app: INestMicroservice;
  let client: ClientProxy;
  const cartService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };

  beforeAll(async () => {
    const port = await freePort();
    const module = await Test.createTestingModule({
      controllers: [CartController],
      providers: [{ provide: CartService, useValue: cartService }],
    }).compile();
    app = module.createNestMicroservice({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port },
    });
    // Misma configuración que main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.listen();
    client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port },
    });
    await client.connect();
  });

  afterAll(async () => {
    client.close();
    await app.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(cartService).forEach((fn) => fn.mockResolvedValue(emptyCart));
  });

  it('cart_get delega en el servicio con el userId', async () => {
    await expect(
      firstValueFrom(client.send(MARKET_PATTERNS.CART_GET, { userId })),
    ).resolves.toEqual(emptyCart);
    expect(cartService.getCart).toHaveBeenCalledWith(userId);
  });

  it('cart_add_item delega userId, productId y quantity', async () => {
    await firstValueFrom(
      client.send(MARKET_PATTERNS.CART_ADD_ITEM, {
        userId,
        productId,
        quantity: 2,
      }),
    );
    expect(cartService.addItem).toHaveBeenCalledWith(userId, productId, 2);
  });

  it('rechaza un payload inválido sin llegar al servicio', async () => {
    await expect(
      firstValueFrom(
        client.send(MARKET_PATTERNS.CART_ADD_ITEM, {
          userId,
          productId,
          quantity: 0,
        }),
      ),
    ).rejects.toMatchObject({ status: 400 });
    expect(cartService.addItem).not.toHaveBeenCalled();
  });

  it('rechaza un userId que no es ObjectId', async () => {
    await expect(
      firstValueFrom(client.send(MARKET_PATTERNS.CART_GET, { userId: 'abc' })),
    ).rejects.toMatchObject({ status: 400 });
  });

  it('conserva el código y el cuerpo de las excepciones del servicio (409)', async () => {
    cartService.addItem.mockRejectedValue(
      new ConflictException({ code: 'INSUFFICIENT_STOCK', available: 1 }),
    );
    await expect(
      firstValueFrom(
        client.send(MARKET_PATTERNS.CART_ADD_ITEM, {
          userId,
          productId,
          quantity: 9,
        }),
      ),
    ).rejects.toMatchObject({
      status: 409,
      body: { code: 'INSUFFICIENT_STOCK', available: 1 },
    });
  });
});
