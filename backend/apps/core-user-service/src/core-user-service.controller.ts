import { Controller, Get } from '@nestjs/common';
import { CoreUserServiceService } from './core-user-service.service';

@Controller()
export class CoreUserServiceController {
  constructor(private readonly coreUserServiceService: CoreUserServiceService) {}

  @Get()
  getHello(): string {
    return this.coreUserServiceService.getHello();
  }
}
