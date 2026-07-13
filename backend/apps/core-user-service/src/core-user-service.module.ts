import { Module } from '@nestjs/common';
import { CoreUserServiceController } from './core-user-service.controller';
import { CoreUserServiceService } from './core-user-service.service';

@Module({
  imports: [],
  controllers: [CoreUserServiceController],
  providers: [CoreUserServiceService],
})
export class CoreUserServiceModule {}
