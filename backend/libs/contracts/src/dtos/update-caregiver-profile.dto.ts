import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { PET_SIZES } from '../catalogs';

/** Archivos que un prestador puede tener en cada lista de su perfil. */
export const CAREGIVER_FILE_LIMITS = {
  gallery_images: 20,
  certification_documents: 20,
} as const;

export type CaregiverFileField = keyof typeof CAREGIVER_FILE_LIMITS;

/**
 * Las fotos y los comprobantes no se editan por este DTO: tienen sus propios
 * endpoints de subida y borrado, que controlan el límite y borran el archivo.
 */
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
  @IsIn(PET_SIZES, { each: true })
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
    example: true,
    description:
      'Si el paseador/cuidador acepta clientes nuevos (se muestra como Disponible / No disponible)',
  })
  @IsOptional()
  @IsBoolean()
  is_available?: boolean;
}
