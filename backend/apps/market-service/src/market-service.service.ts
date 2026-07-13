import { Injectable } from '@nestjs/common';

@Injectable()
export class MarketServiceService {
  getHello(): string {
    return 'Hello World!';
  }
}
