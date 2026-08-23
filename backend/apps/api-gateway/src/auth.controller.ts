import { Controller, Post, Body, Inject, HttpStatus, HttpCode, BadRequestException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RegisterDto, LoginDto } from 'y/contracts';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    try {
      // Enviar la petición por TCP al microservicio de usuarios
      const result = await firstValueFrom(
        this.userServiceClient.send({ cmd: 'register_user' }, registerDto),
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al registrar el usuario');
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    try {
      // Enviar credenciales por TCP
      const result = await firstValueFrom(
        this.userServiceClient.send({ cmd: 'login_user' }, loginDto),
      );
      return result;
    } catch (error) {
      throw new BadRequestException(error.message || 'Error al iniciar sesión');
    }
  }
}
