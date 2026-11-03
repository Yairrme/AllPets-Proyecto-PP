import {
  ConflictException,
  INestApplication,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { existsSync, rmSync } from 'fs';
import { basename, join } from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import { MARKET_PATTERNS, UserRole } from 'y/contracts';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { OwnerOrAdminGuard } from './auth/owner-or-admin.guard';
import { RolesGuard } from './auth/roles.guard';
import { UserSessionService } from './auth/user-session.service';
import { MarketClient } from './market/market.client';
import { PublicCaregiversController } from './public-caregivers.controller';
import { CERTIFICATIONS_DIR, UPLOADS_DIR } from './uploads/upload-options';
import { UserClient } from './user.client';
import { UserController } from './user.controller';

/** Gateway real (guards, multer, validación); solo se simulan los microservicios. */
const SECRET = 'secreto-de-test';
const owner = '64b7f0c2a1d3e4f5a6b7c8d9';
const other = '64b7f0c2a1d3e4f5a6b7c8da';
const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64',
);

describe('Acceso a datos privados de los prestadores', () => {
  let app: INestApplication<App>;
  let jwt: JwtService;
  let session: { role: UserRole } | null;
  const users = { send: jest.fn() };
  const market = { send: jest.fn() };
  const forget = jest.fn();

  const auth = async (sub: string, role: UserRole) => {
    session = { role };
    const token = await jwt.signAsync(
      { sub, email: 'a@b.c', role },
      { secret: SECRET },
    );
    return { Authorization: `Bearer ${token}` };
  };
  const server = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: SECRET })],
        }),
        JwtModule.register({}),
      ],
      controllers: [UserController, PublicCaregiversController],
      providers: [
        JwtAuthGuard,
        RolesGuard,
        OwnerOrAdminGuard,
        { provide: UserClient, useValue: users },
        { provide: MarketClient, useValue: market },
        {
          provide: UserSessionService,
          useValue: { find: () => Promise.resolve(session), forget },
        },
      ],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    jwt = moduleRef.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
    rmSync(join(CERTIFICATIONS_DIR, owner), { recursive: true, force: true });
  });

  beforeEach(() => {
    jest.resetAllMocks();
    users.send.mockResolvedValue({});
    market.send.mockResolvedValue({});
  });

  describe('sesión', () => {
    it('un token válido de una cuenta eliminada responde 401', async () => {
      const headers = await auth(owner, UserRole.CLIENT);
      session = null;
      await server().get(`/users/${owner}`).set(headers).expect(401);
    });

    it('vale el rol actual de la cuenta, no el que dice el token', async () => {
      const headers = await auth(owner, UserRole.ADMIN);
      session = { role: UserRole.CLIENT };
      await server().get('/users').set(headers).expect(403);
    });
  });

  describe('teléfono de contacto', () => {
    const url = `/caregivers/${other}/contact`;

    it('sin sesión responde 401 y no consulta el teléfono', async () => {
      await server().get(url).expect(401);
      expect(users.send).not.toHaveBeenCalled();
    });

    it('un cliente con sesión lo obtiene', async () => {
      users.send.mockResolvedValue({ phone: '2991234567' });
      const headers = await auth(owner, UserRole.CLIENT);
      await server().get(url).set(headers).expect(200, { phone: '2991234567' });
    });

    it('otro prestador no lo obtiene', async () => {
      const headers = await auth(owner, UserRole.WALKER);
      await server().get(url).set(headers).expect(403);
    });
  });

  describe('perfil completo', () => {
    const url = `/users/${owner}/caregiver-profile`;

    it('otro usuario recibe 403', async () => {
      const headers = await auth(other, UserRole.CLIENT);
      await server().get(url).set(headers).expect(403);
    });

    it('el dueño y el admin pueden verlo', async () => {
      await server()
        .get(url)
        .set(await auth(owner, UserRole.WALKER))
        .expect(200);
      await server()
        .get(url)
        .set(await auth(other, UserRole.ADMIN))
        .expect(200);
    });

    it('el perfil público usa la consulta que filtra aprobados', async () => {
      await server().get(`/caregivers/${owner}/profile`).expect(200);
      expect(users.send).toHaveBeenCalledWith(
        'get_public_caregiver_profile',
        { user_id: owner },
        expect.any(String),
      );
    });

    it('el PUT ya no acepta listas de archivos', async () => {
      const headers = await auth(owner, UserRole.WALKER);
      await server()
        .put(url)
        .set(headers)
        .send({ gallery_images: ['/uploads/ajena.jpg'] })
        .expect(400);
    });
  });

  describe('comprobantes', () => {
    const url = `/users/${owner}/caregiver-profile/certifications`;

    const upload = async () => {
      users.send.mockResolvedValue({});
      await server()
        .post(url)
        .set(await auth(owner, UserRole.WALKER))
        .attach('files', PNG_1PX, {
          filename: 'permiso.png',
          contentType: 'image/png',
        })
        .expect(201);
      const [, payload] = users.send.mock.calls[0] as [
        string,
        { paths: string[] },
      ];
      return payload.paths[0];
    };

    it('se guardan fuera de la carpeta pública y solo los ven dueño y admin', async () => {
      const filename = await upload();
      expect(filename).toMatch(/^[\w-]+\.png$/);
      expect(existsSync(join(UPLOADS_DIR, filename))).toBe(false);
      expect(existsSync(join(CERTIFICATIONS_DIR, owner, filename))).toBe(true);

      const file = `${url}/${filename}`;
      await server().get(file).expect(401);
      await server()
        .get(file)
        .set(await auth(other, UserRole.CLIENT))
        .expect(403);
      const res = await server()
        .get(file)
        .set(await auth(other, UserRole.ADMIN))
        .expect(200);
      expect(res.headers['content-type']).toContain('image/png');
      expect(res.headers['cache-control']).toBe('private, no-store');
    });

    it('un nombre con ruta relativa no sale de la carpeta del usuario', async () => {
      const headers = await auth(owner, UserRole.WALKER);
      await server()
        .get(`${url}/${encodeURIComponent('../../secreto.png')}`)
        .set(headers)
        .expect(404);
    });

    it('si se supera el límite no queda el archivo en disco', async () => {
      users.send.mockRejectedValue(new ConflictException('límite'));
      await server()
        .post(url)
        .set(await auth(owner, UserRole.WALKER))
        .attach('files', PNG_1PX, {
          filename: 'permiso.png',
          contentType: 'image/png',
        })
        .expect(409);
      const [, payload] = users.send.mock.calls[0] as [
        string,
        { paths: string[] },
      ];
      expect(
        existsSync(join(CERTIFICATIONS_DIR, owner, payload.paths[0])),
      ).toBe(false);
    });

    it('al eliminarlo se borra también el archivo', async () => {
      const filename = await upload();
      await server()
        .delete(`${url}/${filename}`)
        .set(await auth(owner, UserRole.WALKER))
        .expect(200);
      expect(existsSync(join(CERTIFICATIONS_DIR, owner, filename))).toBe(false);
    });
  });

  describe('galería', () => {
    const url = `/users/${owner}/caregiver-profile/gallery`;

    it('si el perfil rechaza la subida, la foto no queda en disco', async () => {
      users.send.mockRejectedValue(new ConflictException('límite'));
      await server()
        .post(url)
        .set(await auth(owner, UserRole.WALKER))
        .attach('files', PNG_1PX, {
          filename: 'foto.png',
          contentType: 'image/png',
        })
        .expect(409);
      const [, payload] = users.send.mock.calls[0] as [
        string,
        { paths: string[] },
      ];
      expect(existsSync(join(UPLOADS_DIR, basename(payload.paths[0])))).toBe(
        false,
      );
    });

    it('si la foto no es del perfil (404) no se borra ningún archivo', async () => {
      users.send.mockRejectedValue(new NotFoundException());
      await server()
        .delete(`${url}/ajena.jpg`)
        .set(await auth(owner, UserRole.WALKER))
        .expect(404);
    });
  });

  describe('eliminar una cuenta', () => {
    it('invalida la sesión, borra el carrito y no devuelve las rutas internas', async () => {
      users.send.mockResolvedValue({
        message: 'ok',
        user_id: other,
        files: [],
      });
      const res = await server()
        .delete(`/users/${other}`)
        .set(await auth(owner, UserRole.ADMIN))
        .expect(200);

      expect(res.body).toEqual({ message: 'ok', user_id: other });
      expect(forget).toHaveBeenCalledWith(other);
      expect(market.send).toHaveBeenCalledWith(MARKET_PATTERNS.CART_DELETE, {
        userId: other,
      });
    });

    it('si el market está caído, la cuenta igual queda eliminada', async () => {
      users.send.mockResolvedValue({
        message: 'ok',
        user_id: other,
        files: [],
      });
      market.send.mockRejectedValue(new Error('caído'));
      await server()
        .delete(`/users/${other}`)
        .set(await auth(owner, UserRole.ADMIN))
        .expect(200);
    });
  });
});
