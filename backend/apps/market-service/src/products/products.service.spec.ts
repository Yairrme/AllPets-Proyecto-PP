import { Model } from 'mongoose';
import { ProductDocument } from './product.schema';
import { ProductsService } from './products.service';

function setup() {
  const chain = {
    sort: jest.fn(() => chain),
    skip: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    lean: jest.fn(() => chain),
    exec: () => Promise.resolve([{ title: 'Hueso' }]),
  };
  const model = {
    find: jest.fn(() => chain),
    countDocuments: jest.fn(() => ({ exec: () => Promise.resolve(25) })),
    aggregate: jest.fn((pipeline: Record<string, any>[]) => ({
      exec: () =>
        Promise.resolve([
          {
            value: pipeline[1].$group._id === '$petType' ? 'perro' : 'alimento',
            count: 3,
          },
        ]),
    })),
  };
  const service = new ProductsService(
    model as unknown as Model<ProductDocument>,
  );
  return { service, model, chain };
}

describe('ProductsService.findAll', () => {
  it('pagina y devuelve el total y las opciones de filtro', async () => {
    const { service, chain } = setup();
    const result = await service.findAll({ page: 2, limit: 10 });

    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(result.pagination).toEqual({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(result.facets).toEqual({
      petTypes: [{ value: 'perro', count: 3 }],
      categories: [{ value: 'alimento', count: 3 }],
    });
  });

  it('las opciones de mascota no se reducen al elegir una mascota', async () => {
    const { service, model } = setup();
    await service.findAll({
      page: 1,
      limit: 10,
      petType: 'perro',
      category: 'alimento',
    });

    expect(model.find).toHaveBeenCalledWith({
      petType: 'perro',
      category: 'alimento',
    });
    const matches = model.aggregate.mock.calls.map(([p]) => p[0].$match);
    expect(matches).toEqual([{}, { petType: 'perro' }]);
  });

  it('la búsqueda trata el texto como literal, no como expresión regular', async () => {
    const { service, model } = setup();
    await service.findAll({ page: 1, limit: 10, q: 'a.*(' });
    const [[filter]] = model.find.mock.calls as unknown as [
      [{ $or: Record<string, { $regex: string }>[] }],
    ];
    expect(filter.$or[0].title.$regex).toBe('a\\.\\*\\(');
  });

  it('el orden por precio desempata por _id: es estable entre páginas', async () => {
    const { service, chain } = setup();
    await service.findAll({ page: 1, limit: 10, sort: 'precio-desc' });
    expect(chain.sort).toHaveBeenCalledWith({ price: -1, _id: 1 });
  });
});
