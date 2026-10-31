import {
  Controller,
  Post,
  Body,
  Inject,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterDto, LoginDto } from 'y/contracts';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

/**
 * Controlador de Autenticación en el API Gateway (`/auth`).
 * Expone los endpoints HTTP públicos de registro e inicio de sesión, aplica límites
 * de velocidad (Rate Limiting) contra fuerza bruta/spam y delega la lógica al
 * microservicio `core-user-service` mediante mensajes TCP.
 */
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    // Cliente TCP inyectado para comunicarse con `core-user-service` (puerto 3001)
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  /**
   * Registra un nuevo usuario (`client`, `walker` o `caregiver`).
   * Si es trabajador, `core-user-service` también crea su perfil profesional inicial.
   */
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
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Envía el comando TCP `register_user` al microservicio y espera la respuesta
      const result = await firstValueFrom(
        this.userServiceClient.send({ cmd: 'register_user' }, registerDto),
      );
      return result;
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al registrar el usuario',
      );
    }
  }

  /**
   * Autentica al usuario con email y contraseña y devuelve un JWT (`access_token`)
   * junto con los datos públicos del usuario.
   */
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
  async login(@Body() loginDto: LoginDto) {
    try {
      // Envía el comando TCP `login_user` al microservicio para validar credenciales y firmar el JWT
      const result = await firstValueFrom(
        this.userServiceClient.send({ cmd: 'login_user' }, loginDto),
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al iniciar sesión');
    }
  }
}
