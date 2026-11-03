import {
  validateGatewayEnvironment,
  validateMarketEnvironment,
  validateUserServiceEnvironment,
} from './env.validation';

const KEY = Buffer.alloc(32, 1).toString('base64');
const gateway = { JWT_SECRET: 'x', PORT: '3000', USER_SERVICE_PORT: '3001' };
const userService = {
  JWT_SECRET: 'x',
  MONGO_URI_USERS: 'mongodb://a/b',
  PORT_USER_SERVICE_TCP: '3001',
  PHONE_ENCRYPTION_KEY: KEY,
};

describe('Validación del entorno por servicio', () => {
  it('el gateway no exige la clave de teléfonos ni la base de usuarios', () => {
    expect(() => validateGatewayEnvironment(gateway)).not.toThrow();
  });

  it('el servicio de usuarios rechaza una clave de teléfonos inválida', () => {
    expect(() =>
      validateUserServiceEnvironment({
        ...userService,
        PHONE_ENCRYPTION_KEY: 'corta',
      }),
    ).toThrow('32 bytes');
  });

  it('rechaza un puerto inválido', () => {
    expect(() =>
      validateGatewayEnvironment({ ...gateway, PORT: 'abc' }),
    ).toThrow('puerto');
  });

  it('el market funciona en desarrollo con sus valores por defecto', () => {
    expect(() => validateMarketEnvironment({})).not.toThrow();
  });

  describe('en producción', () => {
    const production = { NODE_ENV: 'production' };

    it('exige un JWT_SECRET largo', () => {
      expect(() =>
        validateUserServiceEnvironment({ ...userService, ...production }),
      ).toThrow('JWT_SECRET');
    });

    it('exige los orígenes de CORS en el gateway', () => {
      expect(() =>
        validateGatewayEnvironment({
          ...gateway,
          ...production,
          JWT_SECRET: 'x'.repeat(32),
          MARKET_SERVICE_PORT: '3002',
        }),
      ).toThrow('CORS_ORIGINS');
    });

    it('exige la base del market', () => {
      expect(() => validateMarketEnvironment(production)).toThrow(
        'MONGO_URI_MARKET',
      );
    });
  });
});
