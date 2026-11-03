/**
 * Rota JWT_SECRET y PHONE_ENCRYPTION_KEY del archivo .env y vuelve a cifrar los
 * teléfonos guardados. Se ejecuta desde backend/ con los servicios detenidos:
 *
 *   npm run secrets:rotate            -> solo informa qué haría
 *   npm run secrets:rotate -- --apply -> aplica los cambios
 *
 * Es reanudable: las claves nuevas se guardan en .env.rotating antes de tocar la
 * base. Si se corta, volver a ejecutarlo reutiliza esas claves y saltea los
 * teléfonos que ya estén cifrados con la clave nueva.
 * Al terminar, las sesiones abiertas dejan de valer (hay que volver a iniciar sesión).
 */
const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');
const fs = require('fs');
const mongoose = require('mongoose');

const ENV_FILE = '.env';
const PENDING_FILE = '.env.rotating';
const PREFIX = 'enc:v1:';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function readEnv(file) {
  return Object.fromEntries(
    fs
      .readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .filter((line) => /^[A-Z0-9_]+=/.test(line))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1).trim()];
      }),
  );
}

function encrypt(phone, key) {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([
    cipher.update(phone, 'utf8'),
    cipher.final(),
  ]);
  return `${PREFIX}${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64')}`;
}

function decrypt(value, key) {
  const payload = Buffer.from(value.slice(PREFIX.length), 'base64');
  const decipher = createDecipheriv(
    'aes-256-gcm',
    key,
    payload.subarray(0, IV_LENGTH),
  );
  decipher.setAuthTag(payload.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH));
  return Buffer.concat([
    decipher.update(payload.subarray(IV_LENGTH + AUTH_TAG_LENGTH)),
    decipher.final(),
  ]).toString('utf8');
}

function canDecrypt(value, key) {
  try {
    decrypt(value, key);
    return true;
  } catch {
    return false;
  }
}

function replaceEnvValues(content, values) {
  return Object.entries(values).reduce(
    (text, [name, value]) =>
      text.replace(new RegExp(`^${name}=.*$`, 'm'), `${name}=${value}`),
    content,
  );
}

async function main() {
  const apply = process.argv.includes('--apply');
  const env = readEnv(ENV_FILE);
  const oldKey = Buffer.from(env.PHONE_ENCRYPTION_KEY ?? '', 'base64');
  if (oldKey.length !== 32 || !env.MONGO_URI_USERS || !env.JWT_SECRET) {
    throw new Error(
      `${ENV_FILE} debe tener MONGO_URI_USERS, JWT_SECRET y una PHONE_ENCRYPTION_KEY válida.`,
    );
  }

  const pending = fs.existsSync(PENDING_FILE)
    ? readEnv(PENDING_FILE)
    : {
        JWT_SECRET: randomBytes(48).toString('base64'),
        PHONE_ENCRYPTION_KEY: randomBytes(32).toString('base64'),
      };
  const newKey = Buffer.from(pending.PHONE_ENCRYPTION_KEY, 'base64');

  if (apply && !fs.existsSync(PENDING_FILE)) {
    fs.writeFileSync(
      PENDING_FILE,
      `JWT_SECRET=${pending.JWT_SECRET}\nPHONE_ENCRYPTION_KEY=${pending.PHONE_ENCRYPTION_KEY}\n`,
      { mode: 0o600 },
    );
  }

  await mongoose.connect(env.MONGO_URI_USERS);
  const users = mongoose.connection.collection('users');
  const stats = { reencrypted: 0, plaintext: 0, alreadyRotated: 0 };
  const failed = [];

  // Primero se valida todo: si un teléfono no se puede descifrar, no se cambia nada.
  const pendingUpdates = [];
  for await (const user of users.find({ phone: { $nin: [null, ''] } })) {
    if (!user.phone.startsWith(PREFIX)) {
      stats.plaintext += 1;
      pendingUpdates.push({ _id: user._id, phone: encrypt(user.phone, newKey) });
    } else if (canDecrypt(user.phone, newKey)) {
      stats.alreadyRotated += 1;
    } else if (canDecrypt(user.phone, oldKey)) {
      stats.reencrypted += 1;
      pendingUpdates.push({
        _id: user._id,
        phone: encrypt(decrypt(user.phone, oldKey), newKey),
      });
    } else {
      failed.push(String(user._id));
    }
  }

  console.log('Teléfonos:', stats);
  if (failed.length > 0) {
    throw new Error(
      `No se pudieron descifrar ${failed.length} teléfonos (usuarios: ${failed.join(', ')}). No se modificó nada.`,
    );
  }
  if (!apply) {
    console.log('Modo informe: no se cambió nada. Para aplicar agregá --apply.');
    return;
  }

  for (const { _id, phone } of pendingUpdates) {
    await users.updateOne({ _id }, { $set: { phone } });
  }

  const content = fs.readFileSync(ENV_FILE, 'utf8');
  const backup = `${ENV_FILE}.bak-${Date.now()}`;
  fs.writeFileSync(backup, content, { mode: 0o600 });
  fs.writeFileSync(ENV_FILE, replaceEnvValues(content, pending));
  fs.rmSync(PENDING_FILE);

  console.log(`Listo. ${ENV_FILE} actualizado; copia anterior en ${backup}.`);
  console.log('Borrá esa copia cuando confirmes que todo funciona.');
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
