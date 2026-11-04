import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

/** Roles que se pueden elegir al registrarse (ADMIN queda excluido) */
export const REGISTRABLE_ROLES = [
  UserRole.CLIENT,
  UserRole.WALKER,
  UserRole.CAREGIVER,
];

const PRIVACY_POLICY_MESSAGE =
  'Debes aceptar las políticas de privacidad para registrarte.';

export class RegisterDto {
  @ApiProperty({
    example: 'Juan Pérez',
    description: 'Nombre completo del usuario',
  })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name: string;

  @ApiProperty({
    example: 'juan@allpets.com',
    format: 'email',
    description: 'Correo electrónico único del usuario',
  })
  @IsEmail({}, { message: 'El formato del email no es válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    minLength: 6,
    maxLength: 72,
    description: 'Contraseña (entre 6 y 72 caracteres)',
  })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  // bcrypt ignora todo lo que supere 72 bytes
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;

  @ApiProperty({
    example: 'Neuquén',
    enum: ['Cipolletti', 'Neuquén'],
    description: 'Ciudad de residencia (Cipolletti o Neuquén)',
  })
  @IsString()
  @IsIn(['Cipolletti', 'Neuquén'], {
    message: 'La ciudad debe ser Cipolletti o Neuquén.',
  })
  @IsNotEmpty({ message: 'La ciudad es obligatoria.' })
  city: string;

  @ApiPropertyOptional({
    example: '+5492991234567',
    maxLength: 30,
    description:
      'Número de teléfono (máximo 30 caracteres). Obligatorio para paseadores y cuidadores; opcional para clientes.',
  })
  @ValidateIf((value) => value.role !== UserRole.CLIENT || value.phone != null)
  @IsString({ message: 'El teléfono debe ser texto.' })
  @MaxLength(30, { message: 'El teléfono no puede superar 30 caracteres.' })
  @ValidateIf((value) => value.role !== UserRole.CLIENT)
  @IsNotEmpty({
    message: 'El teléfono es obligatorio para paseadores y cuidadores.',
  })
  phone: string;

  @ApiProperty({
    enum: [UserRole.CLIENT, UserRole.WALKER, UserRole.CAREGIVER],
    example: UserRole.CLIENT,
    description:
      'Rol del usuario en la plataforma (no se permite registrarse como admin)',
  })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  // SEGURIDAD: el rol ADMIN nunca puede autoasignarse desde el registro público
  @IsIn(REGISTRABLE_ROLES, {
    message: 'El rol especificado no es válido.',
  })
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  role: UserRole;

  @ApiProperty({
    example: true,
    description:
      'Aceptación de las políticas de privacidad. Debe ser true para poder registrarse.',
  })
  @IsBoolean({ message: PRIVACY_POLICY_MESSAGE })
  @Equals(true, { message: PRIVACY_POLICY_MESSAGE })
  acceptedPrivacyPolicy: boolean;
}
