import { Injectable } from '@nestjs/common';

@Injectable()
export class CoreUserServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
