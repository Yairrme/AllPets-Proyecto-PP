import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { rm } from 'fs/promises';
import { diskStorage } from 'multer';
import { basename, extname, join } from 'path';

/** Fotos públicas: se sirven como archivos estáticos en /uploads. */
export const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

/** Comprobantes: fuera de /uploads, solo se entregan con sesión de dueño o admin. */
export const CERTIFICATIONS_DIR = join(
  process.cwd(),
  'private-uploads',
  'certifications',
);
mkdirSync(CERTIFICATIONS_DIR, { recursive: true });

/** Tamaño máximo por archivo: 5 MB */
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

/**
 * Tipos permitidos -> extensión que se usará al guardar.
 * La extensión NUNCA se toma del nombre original del cliente, así se evita
 * subir .html/.svg/.js que se servirían desde nuestro origen (XSS almacenado).
 */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const SAVED_FILENAME = /^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
const MONGO_ID = /^[0-9a-f]{24}$/i;

const CONTENT_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const randomFilename = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, filename: string) => void,
) => {
  const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
  const unique = `${Date.now()}-${randomBytes(8).toString('hex')}`;
  cb(null, `${file.fieldname}-${unique}${ext}`);
};

const commonOptions: MulterOptions = {
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 10,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      cb(
        new BadRequestException(
          'Formato no permitido. Solo se aceptan imágenes JPG, PNG o WEBP (máx. 5 MB).',
        ),
        false,
      );
      return;
    }
    cb(null, true);
  },
};

export const imageUploadOptions: MulterOptions = {
  ...commonOptions,
  storage: diskStorage({ destination: UPLOADS_DIR, filename: randomFilename }),
};

/** Carpeta de comprobantes del usuario: un dueño nunca alcanza archivos ajenos. */
function certificationDir(userId: string): string {
  if (!MONGO_ID.test(userId)) {
    throw new BadRequestException('ID de usuario no válido');
  }
  return join(CERTIFICATIONS_DIR, userId);
}

export const certificationUploadOptions: MulterOptions = {
  ...commonOptions,
  storage: diskStorage({
    destination: (req, _file, cb) => {
      try {
        const dir = certificationDir(String(req.params.userId));
        mkdirSync(dir, { recursive: true });
        cb(null, dir);
      } catch (error) {
        cb(error as Error, '');
      }
    },
    filename: randomFilename,
  }),
};

/** Valida un nombre recibido por URL: no admite separadores de carpeta ni "..". */
export function assertSavedFilename(filename: string): void {
  if (!SAVED_FILENAME.test(filename)) {
    throw new NotFoundException('Archivo no encontrado');
  }
}

export function certificationFile(userId: string, filename: string) {
  assertSavedFilename(filename);
  return {
    path: join(certificationDir(userId), filename),
    type:
      CONTENT_TYPES[extname(filename).toLowerCase()] ??
      'application/octet-stream',
  };
}

/** Borra fotos públicas guardadas como /uploads/archivo. Ignora cualquier otra ruta. */
export async function removeUploads(paths: string[]): Promise<void> {
  await Promise.all(
    paths
      .filter((path) => path.startsWith('/uploads/'))
      .map((path) => basename(path))
      .filter((filename) => SAVED_FILENAME.test(filename))
      .map((filename) => rm(join(UPLOADS_DIR, filename), { force: true })),
  );
}

export async function removeCertificationFile(
  userId: string,
  filename: string,
): Promise<void> {
  await rm(certificationFile(userId, filename).path, { force: true });
}

export async function removeUserCertifications(userId: string): Promise<void> {
  await rm(certificationDir(userId), { recursive: true, force: true });
}
