import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

/**
 * Utilidades criptográficas para cifrar y descifrar números de teléfono en reposo.
 * Utiliza AES-256-GCM (cifrado autenticado) con un IV aleatorio de 12 bytes por cada
 * operación y una etiqueta de autenticación (AuthTag) de 16 bytes para detectar adulteraciones.
 */
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
/** Prefijo identificador para distinguir teléfonos ya cifrados de textos planos heredados */
const PREFIX = 'enc:v1:';

/**
 * Cifra un teléfono en texto plano con AES-256-GCM y devuelve `enc:v1:<base64(iv + authTag + ciphertext)>`.
 */
export function encryptPhone(phone: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(phone, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${PREFIX}${Buffer.concat([iv, authTag, encrypted]).toString('base64')}`;
}

/** Comprueba si un valor de teléfono ya se encuentra cifrado con el formato `enc:v1:` */
export function isEncryptedPhone(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(PREFIX);
}

/**
 * Descifra un teléfono almacenado con formato `enc:v1:...`.
 * Si el valor aún no tiene el prefijo (datos antiguos en texto plano), lo devuelve tal cual.
 */
export function decryptPhone(value: string, key: Buffer): string {
  if (!value.startsWith(PREFIX)) {
    return value;
  }

  const payload = Buffer.from(value.slice(PREFIX.length), 'base64');
  const iv = payload.subarray(0, IV_LENGTH);
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    'utf8',
  );
}
