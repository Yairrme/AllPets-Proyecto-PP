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
import { MARKET_PATTERNS, MARKET_SERVICE } from 'y/contracts';

const HEALTH_TIMEOUT_MS = 1000;

@ApiTags('Health')
@SkipThrottle() // Los health checks (Docker, monitoreo) no deben ser limitados
@Controller('health')
export class HealthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
    @Inject(MARKET_SERVICE) private readonly marketServiceClient: ClientProxy,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Verificar salud del Gateway y Microservicios' })
  @ApiResponse({
    status: 200,
    description: 'Todos los servicios están operativos',
  })
  @ApiResponse({
    status: 503,
    description:
      'Uno o más microservicios no responden o no tienen base de datos',
  })
  async check() {
    const [coreUserService, marketService] = await Promise.all([
      this.ping(this.userServiceClient, { cmd: 'health_check' }),
      this.ping(this.marketServiceClient, MARKET_PATTERNS.HEALTH_CHECK),
    ]);
    const dependencies = { coreUserService, marketService };

    // Un servicio sin base de datos responde "degraded": tampoco está operativo.
    if (!this.isHealthy(coreUserService) || !this.isHealthy(marketService)) {
      throw new ServiceUnavailableException({
        status: 'error',
        service: 'api-gateway',
        dependencies,
      });
    }

    return { status: 'ok', service: 'api-gateway', dependencies };
  }

  private isHealthy(dependency: unknown): boolean {
    return (dependency as { status?: unknown } | null)?.status === 'ok';
  }

  private async ping(client: ClientProxy, pattern: object): Promise<unknown> {
    try {
      return await firstValueFrom(
        client.send(pattern, {}).pipe(timeout(HEALTH_TIMEOUT_MS)),
      );
    } catch {
      return 'unavailable';
    }
  }
}
