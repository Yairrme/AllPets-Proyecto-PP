import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength } from 'class-validator';
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

  @IsEnum(UserRole, { message: 'El rol especificado no es válido.' })
  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  role: UserRole;
}
