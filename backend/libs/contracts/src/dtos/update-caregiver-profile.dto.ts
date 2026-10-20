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

export class UpdateCaregiverProfileDto {
  @ApiPropertyOptional({
    example:
      'Amante de los animales con más de 3 años de experiencia en paseos.',
    description: 'Biografía / descripción del cuidador',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: ['Paseo de perros', 'Cuidado a domicilio', 'Guardería canina'],
    description: 'Lista de servicios ofrecidos',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({
    example: ['Lunes a Viernes 08:00 - 18:00', 'Sábados por la mañana'],
    description: 'Disponibilidad horaria',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  availability?: string[];

  @ApiPropertyOptional({
    example: 4500,
    description: 'Tarifa por hora en pesos',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  hourly_rate?: number;

  @ApiPropertyOptional({
    example: 3,
    description: 'Años de experiencia del paseador/cuidador',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  experience_years?: number;

  @ApiPropertyOptional({
    example: ['pequeño', 'mediano', 'grande'],
    description: 'Tamaños de mascotas aceptados',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsIn(['pequeño', 'mediano', 'grande'], { each: true })
  accepted_sizes?: string[];

  @ApiPropertyOptional({
    example: '+5492991234567',
    description:
      'Teléfono de contacto del trabajador (actualiza el documento User)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({
    example: '/uploads/profile-123.jpg',
    description: 'Ruta o URL de la imagen de perfil',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(UPLOAD_PATH_REGEX, { message: UPLOAD_PATH_MESSAGE })
  profile_image?: string;

  @ApiPropertyOptional({
    example: ['/uploads/gallery-1.jpg', '/uploads/gallery-2.jpg'],
    description: 'Rutas de las fotos de la galería',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(UPLOAD_PATH_REGEX, { each: true, message: UPLOAD_PATH_MESSAGE })
  gallery_images?: string[];

  @ApiPropertyOptional({
    example: ['Permiso Municipal Cipolletti', 'Primeros Auxilios Veterinarios'],
    description: 'Certificaciones y permisos municipales del paseador/cuidador',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({
    example: ['/uploads/cert-1.jpg'],
    description:
      'Rutas de fotos o comprobantes de certificaciones y permisos municipales',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @Matches(UPLOAD_PATH_REGEX, { each: true, message: UPLOAD_PATH_MESSAGE })
  certification_documents?: string[];
}
