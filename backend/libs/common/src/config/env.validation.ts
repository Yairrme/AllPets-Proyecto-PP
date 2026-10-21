type Environment = Record<string, unknown>;

function requiredString(environment: Environment, name: string): string {
  const value = environment[name];

  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`La variable de entorno ${name} es obligatoria.`);
  }

  return value;
}

function requiredPort(environment: Environment, name: string): string {
  const value = requiredString(environment, name);
  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`La variable ${name} debe ser un puerto válido.`);
  }

  return value;
}

export function validateEnvironment(environment: Environment): Environment {
  requiredString(environment, 'JWT_SECRET');
  requiredString(environment, 'MONGO_URI_USERS');
  requiredString(environment, 'PHONE_ENCRYPTION_KEY');
  requiredPort(environment, 'PORT');
  requiredPort(environment, 'USER_SERVICE_PORT');
  requiredPort(environment, 'PORT_USER_SERVICE_TCP');

  const encryptionKey = Buffer.from(
    environment.PHONE_ENCRYPTION_KEY as string,
    'base64',
  );

  if (encryptionKey.length !== 32) {
    throw new Error(
      'PHONE_ENCRYPTION_KEY debe ser una clave base64 de 32 bytes.',
    );
  }

  return environment;
}
