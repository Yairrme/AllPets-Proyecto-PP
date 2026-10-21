import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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
    enum: ['Cipolletti', 'Neuquén'],
    description: 'Ciudad de residencia (Cipolletti o Neuquén)',
  })
  @IsOptional()
  @IsString()
  @IsIn(['Cipolletti', 'Neuquén'], {
    message: 'La ciudad debe ser Cipolletti o Neuquén.',
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
