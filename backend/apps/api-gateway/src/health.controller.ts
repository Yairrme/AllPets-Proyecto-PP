import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Verificar salud del Gateway y Microservicios' })
  @ApiResponse({ status: 200, description: 'Todos los servicios están operativos' })
  @ApiResponse({ status: 503, description: 'Uno o más microservicios no responden' })
  async check() {
    try {
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