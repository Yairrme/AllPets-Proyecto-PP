import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CITIES } from '../catalogs';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres.' })
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'juan@allpets.com',
    description: 'Correo electrónico del usuario',
  })
  @IsOptional()
  @IsEmail({}, { message: 'El formato del email no es válido.' })
  email?: string;

  @ApiPropertyOptional({
    example: 'Cipolletti',
    enum: CITIES,
    description: 'Ciudad de residencia',
  })
  @IsOptional()
  @IsString()
  @IsIn(CITIES, {
    message: `La ciudad debe ser ${CITIES.join(' o ')}.`,
  })
  city?: string;

  @ApiPropertyOptional({
    example: '+5492991234567',
    description: 'Número de teléfono del usuario',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;
}
