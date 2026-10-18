import {
  Controller,
  Post,
  Body,
  Inject,
  HttpStatus,
  HttpCode,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterDto, LoginDto } from 'y/contracts';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario' })
  @ApiResponse({ status: 201, description: 'Usuario creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o email ya en uso' })
  async register(@Body() registerDto: RegisterDto) {
    try {
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

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiResponse({ status: 200, description: 'Login exitoso, devuelve JWT token' })
  @ApiResponse({ status: 400, description: 'Credenciales inválidas' })
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await firstValueFrom(
        this.userServiceClient.send({ cmd: 'login_user' }, loginDto),
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al iniciar sesión');
    }
  }
}