import type { ObjectSchema } from 'joi';
import {
  gatewayEnvironmentSchema,
  marketEnvironmentSchema,
  userServiceEnvironmentSchema,
} from './env.validation';

const KEY = Buffer.alloc(32, 1).toString('base64');
const gateway = { JWT_SECRET: 'x', PORT: '3000', USER_SERVICE_PORT: '3001' };
const userService = {
  JWT_SECRET: 'x',
  MONGO_URI_USERS: 'mongodb://a/b',
  PORT_USER_SERVICE_TCP: '3001',
  PHONE_ENCRYPTION_KEY: KEY,
};

/** Valida con las mismas opciones que aplica ConfigModule a validationSchema. */
function check(schema: ObjectSchema, environment: Record<string, unknown>) {
  const { error, value } = schema.validate(environment, {
    abortEarly: false,
    allowUnknown: true,
  });
  if (error) throw new Error(error.message);
  return value as Record<string, unknown>;
}

describe('Validación del entorno por servicio', () => {
  it('el gateway no exige la clave de teléfonos ni la base de usuarios', () => {
    expect(() => check(gatewayEnvironmentSchema, gateway)).not.toThrow();
  });

  it('acepta variables que el esquema no declara', () => {
    expect(() =>
      check(gatewayEnvironmentSchema, { ...gateway, PATH: '/usr/bin' }),
    ).not.toThrow();
  });

  it('exige las variables obligatorias y las nombra a todas', () => {
    expect(() => check(gatewayEnvironmentSchema, {})).toThrow(
      /La variable de entorno JWT_SECRET es obligatoria.*PORT.*USER_SERVICE_PORT/,
    );
  });

  it('una variable vacía cuenta como no definida', () => {
    expect(() =>
      check(gatewayEnvironmentSchema, { ...gateway, JWT_SECRET: '   ' }),
    ).toThrow('JWT_SECRET es obligatoria');
  });

  it('el servicio de usuarios rechaza una clave de teléfonos inválida', () => {
    expect(() =>
      check(userServiceEnvironmentSchema, {
        ...userService,
        PHONE_ENCRYPTION_KEY: 'corta',
      }),
    ).toThrow('32 bytes');
  });

  it('el servicio de usuarios acepta una clave de 32 bytes', () => {
    expect(() =>
      check(userServiceEnvironmentSchema, userService),
    ).not.toThrow();
  });

  it('los errores no muestran el valor de los secretos', () => {
    expect(() =>
      check(userServiceEnvironmentSchema, {
        ...userService,
        PHONE_ENCRYPTION_KEY: 'valor-secreto',
      }),
    ).not.toThrow('valor-secreto');
  });

  it.each(['abc', '0', '70000', '30.5'])('rechaza el puerto %s', (value) => {
    expect(() =>
      check(gatewayEnvironmentSchema, { ...gateway, PORT: value }),
    ).toThrow('puerto');
  });

  it('el market funciona en desarrollo con sus valores por defecto', () => {
    expect(() => check(marketEnvironmentSchema, {})).not.toThrow();
  });

  it('una variable opcional vacía no rompe el arranque en desarrollo', () => {
    expect(() =>
      check(gatewayEnvironmentSchema, {
        ...gateway,
        CORS_ORIGINS: '',
        MARKET_SERVICE_PORT: '',
      }),
    ).not.toThrow();
  });

  describe('en producción', () => {
    const production = { NODE_ENV: 'production' };

    it('exige un JWT_SECRET largo', () => {
      expect(() =>
        check(userServiceEnvironmentSchema, { ...userService, ...production }),
      ).toThrow('JWT_SECRET debe tener al menos 32 caracteres');
    });

    it('exige los orígenes de CORS en el gateway', () => {
      expect(() =>
        check(gatewayEnvironmentSchema, {
          ...gateway,
          ...production,
          JWT_SECRET: 'x'.repeat(32),
          MARKET_SERVICE_PORT: '3002',
        }),
      ).toThrow('CORS_ORIGINS');
    });

    it('exige la base del market', () => {
      expect(() => check(marketEnvironmentSchema, production)).toThrow(
        'MONGO_URI_MARKET',
      );
    });

    it('acepta un gateway bien configurado', () => {
      expect(() =>
        check(gatewayEnvironmentSchema, {
          ...gateway,
          ...production,
          JWT_SECRET: 'x'.repeat(32),
          MARKET_SERVICE_PORT: '3002',
          CORS_ORIGINS: 'https://allpets.example',
        }),
      ).not.toThrow();
    });
  });
});
