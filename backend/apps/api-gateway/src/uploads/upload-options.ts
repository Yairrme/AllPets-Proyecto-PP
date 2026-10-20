import { BadRequestException } from '@nestjs/common';
import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { join } from 'path';

export const UPLOADS_DIR = join(process.cwd(), 'uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

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

export const imageUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req, file, cb) => {
      const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
      const unique = `${Date.now()}-${randomBytes(8).toString('hex')}`;
      cb(null, `${file.fieldname}-${unique}${ext}`);
    },
  }),
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
