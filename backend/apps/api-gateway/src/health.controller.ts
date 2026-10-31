import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

/**
 * Controlador de salud (`GET /health`).
 * Verifica que el API Gateway esté activo y que pueda comunicarse por TCP
 * con el microservicio `core-user-service` en menos de 1 segundo.
 */
@ApiTags('Health')
@SkipThrottle() // Los health checks (Docker, monitoreo) no deben ser limitados
@Controller('health')
export class HealthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar salud del Gateway y Microservicios' })
  @ApiResponse({
    status: 200,
    description: 'Todos los servicios están operativos',
  })
  @ApiResponse({
    status: 503,
    description: 'Uno o más microservicios no responden',
  })
  async check() {
    try {
      // Envía un ping TCP `{ cmd: 'health_check' }` con un timeout máximo de 1000 ms
      const userService = await firstValueFrom(
        this.userServiceClient
          .send({ cmd: 'health_check' }, {})
          .pipe(timeout(1000)),
      );

      return {
        status: 'ok',
        service: 'api-gateway',
        dependencies: {
          coreUserService: userService,
        },
      };
    } catch {
      // Si el microservicio no responde a tiempo, devuelve HTTP 503 Service Unavailable
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api-gateway',
        dependencies: {
          coreUserService: 'unavailable',
        },
      });
    }
  }
}
