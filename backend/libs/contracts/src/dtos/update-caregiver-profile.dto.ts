import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Solo se aceptan rutas generadas por nuestros endpoints de subida
 * (ej: /uploads/file-1700000000000-abcd.jpg). Evita inyectar URLs externas
 * o esquemas peligrosos como javascript: en campos de imagen.
 */
const UPLOAD_PATH_REGEX =
  /^\/uploads\/[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|gif)$/i;
const UPLOAD_PATH_MESSAGE = 'Ruta de imagen no válida.';
/** Patrón (OpenAPI) equivalente a UPLOAD_PATH_REGEX, para documentarlo. */
const UPLOAD_PATH_PATTERN =
  '^/uploads/[A-Za-z0-9_-]+\\.(jpg|jpeg|png|webp|gif)$';
const ACCEPTED_SIZES = ['pequeño', 'mediano', 'grande'];

export class UpdateCaregiverProfileDto {
  @ApiPropertyOptional({
    example:
      'Amante de los animales con más de 3 años de experiencia en paseos.',
    maxLength: 500,
    description: 'Biografía / descripción del cuidador (máx. 500 caracteres)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: ['Paseo de perros', 'Cuidado a domicilio', 'Guardería canina'],
    description: 'Lista de servicios ofrecidos (máx. 20)',
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({
    example: ['Lunes a Viernes 08:00 - 18:00', 'Sábados por la mañana'],
    description: 'Disponibilidad horaria (máx. 50 ítems)',
    type: [String],
    maxItems: 50,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  availability?: string[];

  @ApiPropertyOptional({
    example: 4500,
    minimum: 0,
    description: 'Tarifa por hora en pesos (mínimo 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({
    example: 3,
    minimum: 0,
    description: 'Años de experiencia del paseador/cuidador (mínimo 0)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experience_years?: number;

  @ApiPropertyOptional({
    example: ['pequeño', 'mediano', 'grande'],
    description: 'Tamaños de mascotas aceptados (máx. 3, solo estos valores)',
    isArray: true,
    enum: ACCEPTED_SIZES,
    maxItems: 3,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(ACCEPTED_SIZES, { each: true })
  accepted_sizes?: string[];

  @ApiPropertyOptional({
    example: '+5492991234567',
    maxLength: 50,
    description:
      'Teléfono de contacto del trabajador, máx. 50 caracteres (actualiza el documento User)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    example: '/uploads/profile-123.jpg',
    maxLength: 500,
    pattern: UPLOAD_PATH_PATTERN,
    description:
      'Ruta de una imagen ya subida por la API (/uploads/<archivo>.jpg|jpeg|png|webp|gif). No acepta URLs externas.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(UPLOAD_PATH_REGEX, { message: UPLOAD_PATH_MESSAGE })
  profile_image?: string;

  @ApiPropertyOptional({
    example: ['/uploads/gallery-1.jpg', '/uploads/gallery-2.jpg'],
    description:
      'Rutas de las fotos de la galería, máx. 20. Cada una con formato /uploads/<archivo>.jpg|jpeg|png|webp|gif.',
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(UPLOAD_PATH_REGEX, { each: true, message: UPLOAD_PATH_MESSAGE })
  gallery_images?: string[];

  @ApiPropertyOptional({
    example: ['Permiso Municipal Cipolletti', 'Primeros Auxilios Veterinarios'],
    description:
      'Certificaciones y permisos municipales del paseador/cuidador (máx. 30 ítems de texto)',
    type: [String],
    maxItems: 30,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({
    example: ['/uploads/cert-1.jpg'],
    description:
      'Rutas de comprobantes ya subidos por la API, máx. 20. Cada una con formato /uploads/<archivo>.jpg|jpeg|png|webp|gif.',
    type: [String],
    maxItems: 20,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(UPLOAD_PATH_REGEX, { each: true, message: UPLOAD_PATH_MESSAGE })
  certification_documents?: string[];
}
