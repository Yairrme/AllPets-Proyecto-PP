import {
  Controller,
  Get,
  Inject,
  Param,
  BadRequestException,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { PaginationDto } from 'y/contracts';

@Controller('caregivers')
export class PublicCaregiversController {
  constructor(
    @Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy,
  ) {}

  @Get()
  async getCaregivers(@Query() pagination: PaginationDto) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send({ cmd: 'get_caregivers' }, pagination),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener paseadores y cuidadores',
      );
    }
  }

  @Get(':userId/profile')
  async getCaregiverProfile(@Param('userId') userId: string) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_caregiver_profile' },
          { user_id: userId },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener el perfil del cuidador',
      );
    }
  }

  @Get(':caregiverId/reviews')
  async getReviews(
    @Param('caregiverId') caregiverId: string,
    @Query() pagination: PaginationDto,
  ) {
    try {
      return await firstValueFrom(
        this.userServiceClient.send(
          { cmd: 'get_reviews_for_caregiver' },
          { caregiver_id: caregiverId, pagination },
        ),
      );
    } catch (error) {
      throw new BadRequestException(
        error.message || 'Error al obtener reseñas del cuidador',
      );
    }
  }
}
