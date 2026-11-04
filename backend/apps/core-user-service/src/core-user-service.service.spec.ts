import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import { randomBytes } from 'crypto';
import { Types } from 'mongoose';
import { ProfileStatus, RegisterDto, UserRole } from 'y/contracts';
import { CoreUserService } from './core-user-service.service';
import { CaregiverProfile } from './schemas/caregiver-profile.schema';
import { Review } from './schemas/review.schema';
import { User } from './schemas/user.schema';
import { encryptPhone } from './security/phone-crypto';

const PHONE_KEY = randomBytes(32);

/** Imita la cadena de Mongoose: find().sort().skip().limit().select().exec() */
const query = <T>(result: T) => {
  const chain = {
    sort: () => chain,
    skip: () => chain,
    limit: () => chain,
    select: () => chain,
    exec: () => Promise.resolve(result),
  };
  return chain;
};

const userDoc = (name: string, phone: string | null = null) => {
  const _id = new Types.ObjectId();
  const data = {
    _id,
    name,
    email: `${name}@test.com`,
    password_hash: 'hash',
    role: UserRole.WALKER,
    city: 'Cipolletti',
    phone,
  };
  return { ...data, toObject: () => ({ ...data }) };
};

async function createService(models: {
  user?: object;
  profile?: object;
  review?: object;
}) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      CoreUserService,
      { provide: getModelToken(User.name), useValue: models.user ?? {} },
      {
        provide: getModelToken(CaregiverProfile.name),
        useValue: models.profile ?? {},
      },
      { provide: getModelToken(Review.name), useValue: models.review ?? {} },
      { provide: JwtService, useValue: {} },
      {
        provide: ConfigService,
        useValue: { get: () => PHONE_KEY.toString('base64') },
      },
    ],
  }).compile();
  return moduleRef.get(CoreUserService);
}

describe('CoreUserService.getCaregivers (directorio público)', () => {
  const stagesOf = (aggregate: jest.Mock) =>
    aggregate.mock.calls[0][0] as Record<string, any>[];
  const stage = (stages: Record<string, any>[], name: string) =>
    stages.filter((s) => name in s).map((s) => s[name]);

  async function run(
    filters: object,
    rows: object[] = [],
    count = rows.length,
  ) {
    const aggregate = jest.fn(() =>
      query([{ data: rows, total: count ? [{ count }] : [] }]),
    );
    const service = await createService({
      user: { collection: { name: 'users' } },
      profile: { aggregate },
    });
    const result = await service.getCaregivers({
      page: 2,
      limit: 12,
      ...filters,
    });
    return { result, stages: stagesOf(aggregate) };
  }

  it('devuelve al usuario con su perfil adentro y la paginación real', async () => {
    const { result } = await run(
      {},
      [{ user: { name: 'ana' }, hourly_rate: 5000, is_available: false }],
      25,
    );
    expect(result.data[0]).toEqual({
      name: 'ana',
      profile: { hourly_rate: 5000, is_available: false },
    });
    expect(result.pagination).toEqual({
      page: 2,
      limit: 12,
      total: 25,
      totalPages: 3,
    });
  });

  it('solo parte de perfiles aprobados: un usuario sin perfil no aparece', async () => {
    const { stages } = await run({});
    expect(stages[0].$match.status).toEqual({
      $in: [ProfileStatus.APPROVED, null],
    });
  });

  it('del usuario solo publica una lista blanca de campos', async () => {
    const { stages } = await run({});
    const [lookup] = stage(stages, '$lookup');
    const fields = Object.keys(lookup.pipeline[0].$project);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'role', 'city', 'profile_image']),
    );
    for (const secret of ['email', 'phone', 'password_hash']) {
      expect(fields).not.toContain(secret);
    }
  });

  it('nunca incluye los comprobantes', async () => {
    const { stages } = await run({});
    expect(stage(stages, '$project')[0]).toMatchObject({
      certification_documents: 0,
    });
  });

  it('aplica los filtros en la base', async () => {
    const { stages } = await run({
      city: 'Neuquén',
      role: UserRole.WALKER,
      max_rate: 5000,
      min_rating: 4,
      pet_size: 'grande',
      available: true,
    });
    const [profileMatch, userMatch] = stage(stages, '$match');
    expect(profileMatch).toMatchObject({
      hourly_rate: { $lte: 5000 },
      rating_avg: { $gte: 4 },
      is_available: { $ne: false },
    });
    expect(profileMatch.$or[0]).toEqual({ accepted_sizes: 'grande' });
    expect(userMatch).toMatchObject({
      'user.city': 'Neuquén',
      'user.role': UserRole.WALKER,
    });
  });

  it('la búsqueda trata el texto como literal, no como expresión regular', async () => {
    const { stages } = await run({ q: 'a.*(' });
    const [, userMatch] = stage(stages, '$match');
    expect(userMatch.$or[0]['user.name'].$regex).toBe('a\\.\\*\\(');
  });

  it('el orden es estable entre páginas y primero los disponibles', async () => {
    const { stages } = await run({});
    expect(stage(stages, '$sort')[0]).toEqual({
      takes_clients: -1,
      created_at: -1,
      _id: -1,
    });
  });
});

describe('CoreUserService.getCaregiverContact', () => {
  const ana = userDoc('ana', encryptPhone('2991234567', PHONE_KEY));
  const withProfile = async (profile: object | null) =>
    createService({
      user: { findById: () => query(ana) },
      profile: { findOne: () => query(profile) },
    });

  it('devuelve el teléfono descifrado', async () => {
    const service = await withProfile({ is_available: true });
    await expect(
      service.getCaregiverContact(ana._id.toString()),
    ).resolves.toEqual({ phone: '2991234567' });
  });

  it('no lo entrega si no está aprobado', async () => {
    const service = await withProfile(null);
    await expect(
      service.getCaregiverContact(ana._id.toString()),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('no lo entrega si no toma clientes nuevos', async () => {
    const service = await withProfile({ is_available: false });
    await expect(
      service.getCaregiverContact(ana._id.toString()),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});

describe('CoreUserService.register', () => {
  const dto = {
    name: 'Ana',
    email: 'ana@test.com',
    password: 'secreto123',
    city: 'Neuquén',
    phone: '2991234567',
    role: UserRole.WALKER,
  } as RegisterDto;

  function userModel(save: () => Promise<unknown>) {
    const model = jest.fn(() => ({ save })) as unknown as jest.Mock & {
      findOne: jest.Mock;
      deleteOne: jest.Mock;
    };
    model.findOne = jest.fn(() => query(null));
    model.deleteOne = jest.fn(() => query({ deletedCount: 1 }));
    return model;
  }

  it('dos registros simultáneos: el índice único responde 409, no 500', async () => {
    const service = await createService({
      user: userModel(() => Promise.reject({ code: 11000 })),
    });
    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('si falla el perfil, deshace el usuario (no queda visible sin revisión)', async () => {
    const saved = userDoc('ana');
    const user = userModel(() => Promise.resolve(saved));
    const failure = new Error('falló el perfil');
    const service = await createService({
      user,
      profile: jest.fn(() => ({ save: () => Promise.reject(failure) })),
    });

    await expect(service.register(dto)).rejects.toBe(failure);
    expect(user.deleteOne).toHaveBeenCalledWith({ _id: saved._id });
  });
});

describe('CoreUserService.deleteUser', () => {
  it('recalcula a los cuidadores reseñados, incluso si quedan sin reseñas', async () => {
    const userId = new Types.ObjectId();
    const caregiverId = new Types.ObjectId();
    const updateOne = jest.fn(() => query({}));
    const service = await createService({
      user: {
        findById: () =>
          query({ _id: userId, profile_image: '/uploads/avatar.jpg' }),
        deleteOne: () => query({}),
      },
      profile: {
        findOne: () =>
          query({
            profile_image: '/uploads/foto.jpg',
            gallery_images: ['/uploads/g1.jpg'],
            certification_documents: [],
          }),
        deleteOne: () => query({}),
        updateOne,
      },
      review: {
        distinct: () => query([caregiverId]),
        deleteMany: () => query({}),
        aggregate: () => query([]),
      },
    });

    const result = await service.deleteUser(userId.toString());

    expect(updateOne).toHaveBeenCalledWith(
      { user_id: caregiverId },
      { $set: { rating_avg: 0, total_reviews: 0 } },
    );
    expect(result.files).toEqual([
      '/uploads/avatar.jpg',
      '/uploads/foto.jpg',
      '/uploads/g1.jpg',
    ]);
  });
});

describe('CoreUserService: edición de la propia reseña', () => {
  const reviewId = new Types.ObjectId().toString();
  const authorId = new Types.ObjectId().toString();
  const caregiverId = new Types.ObjectId();

  /** El promedio sale de la base: 2 reseñas de 4 y 2 estrellas. */
  function setup(found: object | null) {
    const updateOne = jest.fn(() => query({}));
    const findOneAndUpdate = jest.fn(() => query(found));
    const findOneAndDelete = jest.fn(() => query(found));
    const models = {
      review: {
        findOneAndUpdate,
        findOneAndDelete,
        aggregate: () => query([{ avg: 3, total: 2 }]),
      },
      profile: { updateOne },
    };
    return { models, updateOne, findOneAndUpdate, findOneAndDelete };
  }

  it('solo busca entre las reseñas del autor', async () => {
    const { models, findOneAndUpdate } = setup({ caregiver_id: caregiverId });
    const service = await createService(models);
    await service.updateReview(reviewId, authorId, { score: 2 });

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: new Types.ObjectId(reviewId),
        reviewer_id: new Types.ObjectId(authorId),
      },
      { $set: { score: 2 } },
      expect.objectContaining({ runValidators: true }),
    );
  });

  it('editar recalcula el promedio del prestador', async () => {
    const { models, updateOne } = setup({ caregiver_id: caregiverId });
    const service = await createService(models);
    await service.updateReview(reviewId, authorId, { score: 2 });
    expect(updateOne).toHaveBeenCalledWith(
      { user_id: caregiverId },
      { $set: { rating_avg: 3, total_reviews: 2 } },
    );
  });

  it('eliminar recalcula el promedio del prestador', async () => {
    const { models, updateOne } = setup({ caregiver_id: caregiverId });
    const service = await createService(models);
    await service.deleteReview(reviewId, authorId);
    expect(updateOne).toHaveBeenCalled();
  });

  it('una reseña ajena o inexistente responde 404 y no recalcula', async () => {
    const { models, updateOne } = setup(null);
    const service = await createService(models);
    await expect(
      service.updateReview(reviewId, authorId, { score: 2 }),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      service.deleteReview(reviewId, authorId),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it('un ID mal formado responde 404, no un error de la base', async () => {
    const { models } = setup(null);
    const service = await createService(models);
    await expect(
      service.deleteReview('no-es-un-id', authorId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('CoreUserService.addCaregiverFiles', () => {
  const userId = new Types.ObjectId().toString();

  it('la condición del límite y el agregado van en la misma operación', async () => {
    const findOneAndUpdate = jest.fn(() => query({ gallery_images: ['/a'] }));
    const service = await createService({ profile: { findOneAndUpdate } });

    await service.addCaregiverFiles(userId, 'gallery_images', ['/a']);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        $expr: {
          $lte: [{ $size: { $ifNull: ['$gallery_images', []] } }, 19],
        },
      }),
      { $push: { gallery_images: { $each: ['/a'] } } },
      expect.anything(),
    );
  });

  it('si se supera el límite responde 409', async () => {
    const service = await createService({
      profile: {
        findOneAndUpdate: () => query(null),
        exists: () => Promise.resolve({ _id: 'x' }),
      },
    });
    await expect(
      service.addCaregiverFiles(userId, 'gallery_images', ['/a']),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('si no hay perfil responde 404', async () => {
    const service = await createService({
      profile: {
        findOneAndUpdate: () => query(null),
        exists: () => Promise.resolve(null),
      },
    });
    await expect(
      service.addCaregiverFiles(userId, 'gallery_images', ['/a']),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('quitar un archivo que no es del perfil responde 404', async () => {
    const service = await createService({
      profile: { findOneAndUpdate: () => query(null) },
    });
    await expect(
      service.removeCaregiverFile(
        userId,
        'gallery_images',
        '/uploads/ajena.jpg',
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
