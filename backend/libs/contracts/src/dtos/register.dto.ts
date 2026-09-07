import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'El nombre es obligatorio.' })
  name: string;

  @IsEmail({}, { message: 'El formato del email no es válido.' })
  @IsNotEmpty({ message: 'El email es obligatorio.' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres.' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  password: string;

  @IsString()
  @IsIn(['Cipolletti', 'Neuquén'], { message: 'La ciudad debe ser Cipolletti o Neuquén.' })
  @IsNotEmpty({ message: 'La ciudad es obligatoria.' })
  city: string;

  @ValidateIf((value) => value.role !== UserRole.CLIENT)
  @IsString({ message: 'El teléfono debe ser texto.' })
  @ValidateIf((value) => value.role !== UserRole.CLIENT)
  @IsNotEmpty({ message: 'El teléfono es obligatorio para paseadores y cuidadores.' })
  phone: string;

  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsEnum(UserRole, { message: 'El rol especificado no es válido.' })
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  role: UserRole;
}
