import {
  ConflictException,
  INestApplication,
  INestMicroservice,
  NotFoundException,
  ServiceUnavailableException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import {
  ClientProxyFactory,
  ClientsModule,
  Transport,
} from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { createServer } from 'net';
import request from 'supertest';
import { App } from 'supertest/types';
import { MARKET_PATTERNS, MARKET_SERVICE, UserRole } from 'y/contracts';
import { CartController as MarketCartController } from '../../../market-service/src/cart/cart.controller';
import { CartService } from '../../../market-service/src/cart/cart.service';
import { ProductsController as MarketProductsController } from '../../../market-service/src/products/products.controller';
import { ProductsService } from '../../../market-service/src/products/products.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CartController } from './cart.controller';
import { MarketClient } from './market.client';
import { ProductsController } from './products.controller';

/**
 * Prueba de integración: gateway real + market-service real hablando por TCP.
 * Solo se simulan los servicios que tocan MongoDB. Verifica la cadena
 * completa: JWT -> userId -> TCP -> validación -> errores con su código HTTP.
 */
const SECRET = 'secreto-de-test';
const userA = '64b7f0c2a1d3e4f5a6b7c8d9';
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

describe('Gateway + Market (TCP)', () => {
  let gateway: INestApplication<App>;
  let market: INestMicroservice;
  let jwt: JwtService;
  const cartService = {
    getCart: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  const productsService = { findAll: jest.fn(), create: jest.fn() };
  const pipe = () =>
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });

  const tokenFor = (sub: string, role: UserRole = UserRole.CLIENT) =>
    jwt.signAsync({ sub, email: 'a@b.c', role }, { secret: SECRET });

  beforeAll(async () => {
    const port = await freePort();

    const marketModule = await Test.createTestingModule({
      controllers: [MarketCartController, MarketProductsController],
      providers: [
        { provide: CartService, useValue: cartService },
        { provide: ProductsService, useValue: productsService },
      ],
    }).compile();
    market = marketModule.createNestMicroservice({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port },
    });
    market.useGlobalPipes(pipe());
    await market.listen();

    const gatewayModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: SECRET })],
        }),
        JwtModule.register({}),
        ClientsModule.register([
          {
            name: MARKET_SERVICE,
            transport: Transport.TCP,
            options: { host: '127.0.0.1', port },
          },
        ]),
      ],
      controllers: [CartController, ProductsController],
      providers: [JwtAuthGuard, RolesGuard, MarketClient],
    }).compile();
    gateway = gatewayModule.createNestApplication();
    gateway.useGlobalPipes(pipe());
    await gateway.init();
    jwt = gatewayModule.get(JwtService);
  });

  afterAll(async () => {
    await gateway.close();
    await market.close();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    Object.values(cartService).forEach((fn) => fn.mockResolvedValue(emptyCart));
  });

  describe('autenticación', () => {
    it('GET /cart sin token responde 401 y no llega al market', async () => {
      await request(gateway.getHttpServer()).get('/cart').expect(401);
      expect(cartService.getCart).not.toHaveBeenCalled();
    });

    it('GET /cart con token inválido responde 401', async () => {
      await request(gateway.getHttpServer())
        .get('/cart')
        .set('Authorization', 'Bearer cualquiercosa')
        .expect(401);
    });

    it('el userId sale del token y no de lo que mande el cliente', async () => {
      const token = await tokenFor(userA);
      await request(gateway.getHttpServer())
        .get('/cart')
        .set('Authorization', `Bearer ${token}`)
        .set('x-user-id', '64b7f0c2a1d3e4f5a6b7c8ff')
        .expect(200, emptyCart);
      expect(cartService.getCart).toHaveBeenCalledWith(userA);
    });
  });

  describe('carrito', () => {
    it('POST /cart/items agrega con el usuario del token', async () => {
      const token = await tokenFor(userA);
      await request(gateway.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 2 })
        .expect(201);
      expect(cartService.addItem).toHaveBeenCalledWith(userA, productId, 2);
    });

    it('rechaza con 400 un userId en el body (no se puede suplantar)', async () => {
      const token = await tokenFor(userA);
      await request(gateway.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 1, userId: '64b7f0c2a1d3e4f5a6b7c8ff' })
        .expect(400);
      expect(cartService.addItem).not.toHaveBeenCalled();
    });

    it.each([
      ['cantidad 0', { productId, quantity: 0 }],
      ['cantidad decimal', { productId, quantity: 1.5 }],
      ['cantidad enorme', { productId, quantity: 1000 }],
      ['productId inválido', { productId: 'abc', quantity: 1 }],
    ])('POST /cart/items rechaza con 400: %s', async (_name, body) => {
      const token = await tokenFor(userA);
      await request(gateway.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send(body)
        .expect(400);
    });

    it('sin stock: el frontend recibe 409 con el detalle (no un 500)', async () => {
      cartService.addItem.mockRejectedValue(
        new ConflictException({ code: 'INSUFFICIENT_STOCK', available: 3 }),
      );
      const token = await tokenFor(userA);
      const res = await request(gateway.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 5 })
        .expect(409);
      expect(res.body).toMatchObject({
        code: 'INSUFFICIENT_STOCK',
        available: 3,
      });
    });

    it('producto inexistente: 404', async () => {
      cartService.addItem.mockRejectedValue(
        new NotFoundException('Producto no encontrado'),
      );
      const token = await tokenFor(userA);
      await request(gateway.getHttpServer())
        .post('/cart/items')
        .set('Authorization', `Bearer ${token}`)
        .send({ productId, quantity: 1 })
        .expect(404);
    });

    it('PATCH, DELETE item y DELETE carrito usan el usuario del token', async () => {
      const token = await tokenFor(userA);
      const auth = { Authorization: `Bearer ${token}` };
      await request(gateway.getHttpServer())
        .patch(`/cart/items/${productId}`)
        .set(auth)
        .send({ quantity: 4 })
        .expect(200);
      await request(gateway.getHttpServer())
        .delete(`/cart/items/${productId}`)
        .set(auth)
        .expect(200);
      await request(gateway.getHttpServer())
        .delete('/cart')
        .set(auth)
        .expect(200);
      expect(cartService.updateItem).toHaveBeenCalledWith(userA, productId, 4);
      expect(cartService.removeItem).toHaveBeenCalledWith(userA, productId);
      expect(cartService.clear).toHaveBeenCalledWith(userA);
    });
  });

  describe('productos', () => {
    it('GET /products es público', async () => {
      productsService.findAll.mockResolvedValue([{ title: 'Hueso' }]);
      await request(gateway.getHttpServer())
        .get('/products')
        .expect(200, [{ title: 'Hueso' }]);
    });

    const product = {
      title: 'Hueso de goma',
      description: 'Ideal para la dentición',
      price: 8.5,
      petType: 'perro',
      category: 'juguetes',
      imageUrl: 'https://img.test/hueso.jpg',
      stock: 10,
    };

    it('POST /products: un cliente recibe 403', async () => {
      const token = await tokenFor(userA, UserRole.CLIENT);
      await request(gateway.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(product)
        .expect(403);
      expect(productsService.create).not.toHaveBeenCalled();
    });

    it('POST /products: un admin crea el producto', async () => {
      productsService.create.mockResolvedValue(product);
      const token = await tokenFor(userA, UserRole.ADMIN);
      await request(gateway.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send(product)
        .expect(201);
      expect(productsService.create).toHaveBeenCalledWith(product);
    });

    it('POST /products: precio negativo -> 400', async () => {
      const token = await tokenFor(userA, UserRole.ADMIN);
      await request(gateway.getHttpServer())
        .post('/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ ...product, price: -1 })
        .expect(400);
    });
  });

  it('si el market-service está caído, el cliente responde 503 (no cuelga ni da 500)', async () => {
    const deadPort = await freePort(); // puerto sin nadie escuchando
    const client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: deadPort },
    });
    await expect(
      new MarketClient(client).send(MARKET_PATTERNS.CART_GET, {
        userId: userA,
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    client.close();
  });
});
