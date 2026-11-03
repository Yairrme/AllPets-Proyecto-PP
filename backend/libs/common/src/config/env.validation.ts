type Environment = Record<string, unknown>;

const MIN_SECRET_LENGTH_IN_PRODUCTION = 32;

const isProduction = (environment: Environment) =>
  environment.NODE_ENV === 'production';

function requiredString(environment: Environment, name: string): string {
  const value = environment[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`La variable de entorno ${name} es obligatoria.`);
  }

  return value;
}

function requiredPort(environment: Environment, name: string): void {
  const port = Number(requiredString(environment, name));

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`La variable ${name} debe ser un puerto válido.`);
  }
}

function requiredJwtSecret(environment: Environment): void {
  const secret = requiredString(environment, 'JWT_SECRET');

  if (
    isProduction(environment) &&
    secret.length < MIN_SECRET_LENGTH_IN_PRODUCTION
  ) {
    throw new Error(
      `En producción JWT_SECRET debe tener al menos ${MIN_SECRET_LENGTH_IN_PRODUCTION} caracteres.`,
    );
  }
}

/** En desarrollo tienen un valor por defecto; en producción un olvido no debe pasar inadvertido. */
function requiredInProduction(environment: Environment, names: string[]): void {
  if (isProduction(environment)) {
    names.forEach((name) => requiredString(environment, name));
  }
}

// Cada servicio exige solo lo que usa: el gateway no necesita la clave de los
// teléfonos ni el market los secretos de autenticación.
export function validateGatewayEnvironment(
  environment: Environment,
): Environment {
  requiredJwtSecret(environment);
  requiredPort(environment, 'PORT');
  requiredPort(environment, 'USER_SERVICE_PORT');
  requiredInProduction(environment, ['MARKET_SERVICE_PORT', 'CORS_ORIGINS']);
  return environment;
}

export function validateUserServiceEnvironment(
  environment: Environment,
): Environment {
  requiredJwtSecret(environment);
  requiredString(environment, 'MONGO_URI_USERS');
  requiredPort(environment, 'PORT_USER_SERVICE_TCP');

  const encryptionKey = Buffer.from(
    requiredString(environment, 'PHONE_ENCRYPTION_KEY'),
    'base64',
  );

  if (encryptionKey.length !== 32) {
    throw new Error(
      'PHONE_ENCRYPTION_KEY debe ser una clave base64 de 32 bytes.',
    );
  }

  return environment;
}

export function validateMarketEnvironment(
  environment: Environment,
): Environment {
  requiredInProduction(environment, [
    'MONGO_URI_MARKET',
    'PORT_MARKET_SERVICE_TCP',
  ]);
  return environment;
}
