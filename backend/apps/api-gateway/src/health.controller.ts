import {
  Controller,
  Get,
  Inject,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Controller('health')
export class HealthController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get()
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
