import { Controller, Post, Body, HttpStatus, HttpCode } from '@nestjs/common';
import { RegisterDto, LoginDto } from 'y/contracts';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserClient } from './user.client';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly users: UserClient) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  // Máx. 5 registros cada 15 minutos por IP (evita creación masiva de cuentas)
  @Throttle({ default: { limit: 5, ttl: 15 * 60_000 } })
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o email ya en uso',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos, probá más tarde',
  })
  register(@Body() registerDto: RegisterDto) {
    return this.users.send(
      'register_user',
      registerDto,
      'Error al registrar el usuario',
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Máx. 5 intentos de login por minuto por IP (fuerza bruta)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso, devuelve JWT token',
  })
  @ApiResponse({ status: 400, description: 'Credenciales inválidas' })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos, probá más tarde',
  })
  login(@Body() loginDto: LoginDto) {
    return this.users.send('login_user', loginDto, 'Error al iniciar sesión');
  }
}
