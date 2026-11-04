import * as Joi from 'joi';

const MIN_SECRET_LENGTH_IN_PRODUCTION = 32;
const PHONE_KEY_BYTES = 32;

/** Una variable vacía o con solo espacios cuenta como si no estuviera definida. */
const blank = Joi.string().allow('').pattern(/^\s*$/);

const text = Joi.string().empty(blank);

const port = Joi.number().integer().min(1).max(65535).empty(blank).messages({
  'number.base': 'La variable {{#label}} debe ser un puerto válido',
  'number.integer': 'La variable {{#label}} debe ser un puerto válido',
  'number.min': 'La variable {{#label}} debe ser un puerto válido',
  'number.max': 'La variable {{#label}} debe ser un puerto válido',
});

const jwtSecret = text
  .required()
  .when('NODE_ENV', {
    is: 'production',
    then: Joi.string().min(MIN_SECRET_LENGTH_IN_PRODUCTION),
  })
  .messages({
    'string.min':
      'En producción {{#label}} debe tener al menos {{#limit}} caracteres',
  });

const phoneEncryptionKey = text
  .required()
  .custom((value: string, helpers) =>
    Buffer.from(value, 'base64').length === PHONE_KEY_BYTES
      ? value
      : helpers.error('any.invalid'),
  )
  .messages({
    'any.invalid': `{{#label}} debe ser una clave base64 de ${PHONE_KEY_BYTES} bytes`,
  });

/** En desarrollo tienen un valor por defecto; en producción un olvido no debe pasar inadvertido. */
const requiredInProduction = (schema: Joi.Schema) =>
  schema.when('NODE_ENV', { is: 'production', then: Joi.required() });

const environmentSchema = (keys: Joi.SchemaMap) =>
  Joi.object(keys)
    .messages({
      'any.required': 'La variable de entorno {{#label}} es obligatoria',
    })
    // Sin comillas alrededor del nombre de la variable en los mensajes.
    .prefs({ errors: { wrap: { label: false } } });

// Cada servicio exige solo lo que usa: el gateway no necesita la clave de los
// teléfonos ni el market los secretos de autenticación.
export const gatewayEnvironmentSchema = environmentSchema({
  JWT_SECRET: jwtSecret,
  PORT: port.required(),
  USER_SERVICE_PORT: port.required(),
  MARKET_SERVICE_PORT: requiredInProduction(port),
  CORS_ORIGINS: requiredInProduction(text),
});

export const userServiceEnvironmentSchema = environmentSchema({
  JWT_SECRET: jwtSecret,
  MONGO_URI_USERS: text.required(),
  PORT_USER_SERVICE_TCP: port.required(),
  PHONE_ENCRYPTION_KEY: phoneEncryptionKey,
});

export const marketEnvironmentSchema = environmentSchema({
  MONGO_URI_MARKET: requiredInProduction(text),
  PORT_MARKET_SERVICE_TCP: requiredInProduction(port),
});
